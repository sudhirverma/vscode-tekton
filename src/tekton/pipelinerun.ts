/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TektonItem } from './tektonitem';
import { TektonNode, Command } from '../tkn';
import { window, ViewColumn } from 'vscode';
import { CliCommand } from '../cli';
import { showPipelineRunPreview } from '../pipeline/pipeline-preview';
import { pipelineRunData } from './restartpipelinerundata';
import { PipelineWizard } from '../pipeline/wizard';
import { startPipeline } from './startpipeline';

export class PipelineRun extends TektonItem {

  static async restart(pipelineRun: TektonNode): Promise<void> {
    if (!pipelineRun) return null;
    const trigger = await pipelineRunData(pipelineRun);
    if (trigger.pipelineRun.workspaces.length === 0 && trigger.pipelineRun.resources.length === 0 && trigger.pipelineRun.params.length === 0) {
      await startPipeline(trigger);
    } else {
      PipelineWizard.create({ trigger, resourceColumn: ViewColumn.Active }, ViewColumn.Active, 'Restart PipelineRun', trigger.PipelineRunName);
    }
  }

  static async describe(pipelineRun: TektonNode): Promise<void> {
    if (!pipelineRun) {
      pipelineRun = await window.showQuickPick(await PipelineRun.getPipelineRunNames(), { placeHolder: 'Select Pipeline Run to describe', ignoreFocusOut: true });
    }
    if (!pipelineRun) return null;
    PipelineRun.tkn.executeInTerminal(Command.describePipelineRuns(pipelineRun.getName()));
  }

  static async list(pipelineRun: TektonNode): Promise<void> {
    if (!pipelineRun) {
      pipelineRun = await window.showQuickPick(await PipelineRun.getPipelineRunNames(), { placeHolder: 'Select Pipeline Run to list', ignoreFocusOut: true });
    }
    if (!pipelineRun) return null;
    PipelineRun.tkn.executeInTerminal(Command.listPipelineRunsInTerminal(pipelineRun.getName()));
  }

  static async logs(pipelineRun: TektonNode): Promise<void> {
    if (!pipelineRun) {
      pipelineRun = await window.showQuickPick(await PipelineRun.getPipelineRunNames(), { placeHolder: 'Select Pipeline Run to see logs', ignoreFocusOut: true });
    }
    if (!pipelineRun) return null;
    PipelineRun.tkn.executeInTerminal(Command.showPipelineRunLogs(pipelineRun.getName()));
  }

  static async followLogs(pipelineRun: TektonNode): Promise<void> {
    if (!pipelineRun) {
      pipelineRun = await window.showQuickPick(await PipelineRun.getPipelineRunNames(), { placeHolder: 'Select Pipeline Run to see logs', ignoreFocusOut: true });
    }
    if (!pipelineRun) return null;
    PipelineRun.tkn.executeInTerminal(Command.showPipelineRunFollowLogs(pipelineRun.getName()));
  }

  static async cancel(pipelineRun: TektonNode): Promise<void> {
    if (!pipelineRun) {
      pipelineRun = await window.showQuickPick(await PipelineRun.getPipelineRunNames(), { placeHolder: 'Select Pipeline Run to cancel', ignoreFocusOut: true });
    }
    if (!pipelineRun) return null;
    PipelineRun.tkn.executeInTerminal(Command.cancelPipelineRun(pipelineRun.getName()));
  }

  static getDeleteCommand(item: TektonNode): CliCommand {
    return Command.deletePipelineRun(item.getName())
  }

  static async showDiagram(item: TektonNode): Promise<void> {
    if (!item) return null;
    await showPipelineRunPreview(item.getName(), item.uid);
  }
}
