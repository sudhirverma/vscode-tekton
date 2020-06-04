/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TektonItem } from './tektonitem';
import { TektonNode, Command, PipelineTaskRunData } from '../tkn';
import { window } from 'vscode';
import { Progress } from '../util/progress';

export class TaskRun extends TektonItem {

  static async listFromPipelineRun(pipelineRun: TektonNode): Promise<void> {
    if (!pipelineRun) {
      pipelineRun = await window.showQuickPick(await TaskRun.getPipelineRunNames(), {placeHolder: 'Select PipelineRun to list TaskRun', ignoreFocusOut: true});
    }
    if (!pipelineRun) return null;
    TaskRun.tkn.executeInTerminal(Command.listTaskRunsForPipelineRunInTerminal(pipelineRun.getName()));
  }

  static async listFromTask(taskRun: TektonNode): Promise<void> {
    if (!taskRun) {
      taskRun = await window.showQuickPick(await TaskRun.getTaskNames(), {placeHolder: 'Select Task to list TaskRun', ignoreFocusOut: true});
    }
    if (!taskRun) return null;
    TaskRun.tkn.executeInTerminal(Command.listTaskRunsForTasksInTerminal(taskRun.getName()));
  }

  static async logs(taskRun: TektonNode): Promise<void> {
    if (!taskRun) {
      taskRun = await window.showQuickPick(await TaskRun.getTaskRunNames(), {placeHolder: 'Select Task Run to see logs', ignoreFocusOut: true});
    }
    if (!taskRun) return null;
    TaskRun.tkn.executeInTerminal(Command.showTaskRunLogs(taskRun.getName()));
  }

  static async followLogs(taskRun: TektonNode): Promise<void> {
    if (!taskRun) {
      taskRun = await window.showQuickPick(await TaskRun.getTaskRunNames(), {placeHolder: 'Select Task Run to see follow logs', ignoreFocusOut: true});
    }
    if (!taskRun) return null;
    TaskRun.tkn.executeInTerminal(Command.showTaskRunFollowLogs(taskRun.getName()));
  }

  static async delete(taskRun: TektonNode): Promise<string> {
    if (!taskRun) {
      taskRun = await window.showQuickPick(await TaskRun.getTaskRunNames(), {placeHolder: 'Select Task Run to delete', ignoreFocusOut: true});
    }
    if (!taskRun) return null;
    const value = await window.showWarningMessage(`Do you want to delete the TaskRun '${taskRun.getName()}'?`, 'Yes', 'Cancel');
    if (value === 'Yes') {
      return Progress.execFunctionWithProgress(`Deleting the TaskRun '${taskRun.getName()}'.`, () =>
        TaskRun.tkn.execute(Command.deleteTaskRun(taskRun.getName())))
        .then(() => TaskRun.explorer.refresh())
        .then(() => `The TaskRun '${taskRun.getName()}' successfully deleted.`)
        .catch((err) => Promise.reject(`Failed to delete the TaskRun '${taskRun.getName()}': '${err}'.`));
    }
    return null;
  }

  static async openDefinition(taskRun: TektonNode): Promise<void> {
    if (!taskRun) {
      taskRun = await window.showQuickPick(await TaskRun.getTaskRunNames(), {placeHolder: 'Select Task Run to Open Task Definition', ignoreFocusOut: true});
    }
    if (!taskRun) return null;
    const taskName = await TaskRun.getTaskNameByTaskRun(taskRun.getName());
    if (taskName) {
      TektonItem.loadTektonResource(taskName[0], taskName[1]);
    }
  }

  static async openConditionDefinition(conditionRun: TektonNode): Promise<void> {
    if (!conditionRun) return null;
    TektonItem.loadTektonResource('conditions', conditionRun.getName());
  }

  private static async getTaskNameByTaskRun(taskRunName: string): Promise<[string, string] | undefined> {
    const result = await TaskRun.tkn.execute(Command.getTaskRun(taskRunName), undefined, false);
    if (result.error) {
      window.showErrorMessage(`TaskRun may not have started yet, try again when it starts running. "${result.error}"`)
      return;
    }
    let data: PipelineTaskRunData;
    try {
      data = JSON.parse(result.stdout);
      // eslint-disable-next-line no-empty
    } catch (ignore) {
    }

    if (data.metadata.labels['tekton.dev/conditionCheck']) {
      window.showErrorMessage(`Cannot find Condition definition for: ${taskRunName}. Please look in Pipeline definition`);
      return;
    }

    return [data.spec.taskRef?.kind ?? 'task', data.metadata.labels['tekton.dev/task']];
  }
}
