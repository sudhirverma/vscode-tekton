/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

'use strict';

import * as os from 'os';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as yaml from 'js-yaml';
import * as fs from 'fs-extra';
import { TknImpl } from '../../src/tkn';
import { Pipeline } from '../../src/tekton/pipeline';
import { PipelineExplorer } from '../../src/pipeline/pipelineExplorer';
import { TektonItem } from '../../src/tekton/tektonitem';
import { TestItem } from './testTektonitem';
import * as vscode from 'vscode';
import { ContextType } from '../../src/context-type';
import { Command } from '../../src/cli-command';
import { TknPipelineTrigger } from '../../src/tekton';
import { PipelineWizard } from '../../src/pipeline/wizard';
import { cli } from '../../src/cli';

const expect = chai.expect;
chai.use(sinonChai);

suite('Tekton/Pipeline', () => {
  const sandbox = sinon.createSandbox();
  let getPipelineStub: sinon.SinonStub;
  let termStub: sinon.SinonStub;
  let executeStub: sinon.SinonStub;
  let cliStub: sinon.SinonStub;
  let showErrorMessageStub: sinon.SinonStub;
  let showQuickPickStub: sinon.SinonStub<unknown[], unknown>;
  const pipelineNode = new TestItem(TknImpl.ROOT, 'test-pipeline', ContextType.PIPELINENODE, null);
  const pipelineItem = new TestItem(pipelineNode, 'Pipelines', ContextType.PIPELINE, null);

  let osStub: sinon.SinonStub;
  let writeFileStub: sinon.SinonStub;
  let unlinkStub: sinon.SinonStub;
  let safeDumpStub: sinon.SinonStub;

  const pipeline: TknPipelineTrigger = {
    apiVersion: 'tekton.dev/v1beta1',
    kind: 'pipeline',
    metadata: {
      name: 'output-pipeline'
    },
    spec: {
      resources: [
        {
          name: 'source-repo',
          type: 'git'
        }
      ],
      params: [
        {
          name: 'args',
          value: 'test'
        }
      ],
      workspaces: [
        {
          name: 'shared-workspace'
        }
      ]
    }
  }

  const secret = [
    {
      kind: 'Secret',
      metadata: {
        name: 'builder-dockercfg-mltgb'
      }
    }
  ]

  const configMap = [
    {
      kind: 'ConfigMap',
      metadata: {
        name: 'config-logging-triggers'
      }
    }
  ]

  const pvc = [
    {
      kind: 'PersistentVolumeClaim',
      metadata: {
        name: 'output-pipeline-run-pvc'
      }
    }
  ]

  const pipelineResource = [
    {
      kind: 'PipelineResource',
      metadata: {
        metadata: {
          name: 'skaffold-git-output-pipelinerun'
        }
      }
    }
  ]

  setup(() => {
    sandbox.stub(vscode.workspace, 'getConfiguration').returns({
      get<T>(): Promise<T|undefined> {
        return Promise.resolve(undefined);
      },
      update(): Promise<void> {
        return Promise.resolve();
      },
      inspect(): {
          key: string;
          } {
        return undefined;
      },
      has(): boolean {
        return true;
      },
      start: true
    });
    showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage');
    executeStub = sandbox.stub(TknImpl.prototype, 'execute').resolves({ error: null, stdout: '', stderr: '' });
    cliStub = sandbox.stub(cli, 'execute').resolves({ error: null, stdout: '', stderr: '' });
    showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
    sandbox.stub(TknImpl.prototype, 'getPipelines').resolves([pipelineItem]);
    getPipelineStub = sandbox.stub(TektonItem, 'getPipelineNames').resolves([pipelineItem]);
    sandbox.stub(vscode.window, 'showInputBox').resolves();
    termStub = sandbox.stub(TknImpl.prototype, 'executeInTerminal').resolves();
    osStub = sandbox.stub(os, 'tmpdir').returns('path');
    writeFileStub = sandbox.stub(fs, 'writeFile').resolves();
    unlinkStub = sandbox.stub(fs, 'unlink').resolves();
    safeDumpStub = sandbox.stub(yaml, 'safeDump').returns('empty');
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('called from \'Tekton Pipelines Explorer\'', () => {

    test('executes the list tkn command in terminal', async () => {
      await Pipeline.list(pipelineItem);
      expect(termStub).calledOnceWith(Command.listPipelinesInTerminal(pipelineItem.getName()));
    });

    test('executes the list tkn command in terminal from command palette', async () => {
      await Pipeline.list(null);
      expect(termStub).calledOnceWith(Command.listPipelinesInTerminal(pipelineItem.getName()));
    });

  });

  suite('called from command palette', () => {

    test('calls the appropriate error message when no pipeline found', async () => {
      getPipelineStub.restore();
      sandbox.stub(TknImpl.prototype, 'getPipelineResources').resolves([]);
      try {
        await Pipeline.list(null);
      } catch (err) {
        expect(err.message).equals('You need at least one Pipeline available. Please create new Tekton Pipeline and try again.');
        return;
      }
    });
  });

  suite('describe', () => {

    test('start returns null when no pipeline available for describe', async () => {
      showQuickPickStub.onFirstCall().resolves(undefined);
      const result = await Pipeline.describe(null);
      expect(result).null;
    });

    test('describe calls the correct tkn command in terminal', async () => {
      await Pipeline.describe(pipelineItem);
      expect(termStub).calledOnceWith(Command.describePipelines(pipelineItem.getName()));
    });

  });

  suite('restart', () => {

    test('start returns null when no pipeline restart', async () => {
      showQuickPickStub.onFirstCall().resolves(undefined);
      const result = await Pipeline.restart(null);
      expect(result).null;
    });
  
  });

  suite('start', () => {

    const pipelineWithEmptySpec = {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'pipeline',
      metadata: {
        name: 'output-pipeline'
      },
      spec: {}
    }

    test('start returns null when no pipeline', async () => {
      showQuickPickStub.onFirstCall().resolves(undefined);
      const result = await Pipeline.start(null);
      expect(result).null;
    });

    test('throw error when fail to start pipeline', async () => {
      executeStub.onFirstCall().resolves({stdout: '', error: 'error'});
      await Pipeline.start(pipelineItem);
      showErrorMessageStub.calledOnce;
    });

    test('starts a pipeline with appropriate resources', async () => {
      executeStub.onFirstCall().resolves({error: null, stdout: JSON.stringify(pipeline), stderr: ''});
      executeStub.onSecondCall().resolves({stdout: JSON.stringify({items: secret}), error: ''});
      executeStub.onThirdCall().resolves({stdout: JSON.stringify({items: configMap}), error: ''});
      executeStub.onCall(3).resolves({stdout: JSON.stringify({items: pvc}), error: ''});
      executeStub.onCall(4).resolves({stdout: JSON.stringify({items: pipelineResource}), error: ''});
      const createStub = sandbox.stub(PipelineWizard, 'create')
      await Pipeline.start(pipelineItem);
      createStub.calledOnce;
    });

    test('starts a pipeline from yaml', async () => {
      const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();
      executeStub.onFirstCall().resolves({error: null, stdout: JSON.stringify(pipelineWithEmptySpec), stderr: ''});
      executeStub.onSecondCall().resolves({stdout: JSON.stringify({items: pipelineResource}), error: ''});
      cliStub.onFirstCall().resolves({error: null, stdout: JSON.stringify(pipelineWithEmptySpec), stderr: ''})
      cliStub.onSecondCall().resolves({ error: null, stdout: 'successful', stderr: '' });
      await Pipeline.start(pipelineItem);
      showInformationMessageStub.calledOnce;
      safeDumpStub.calledOnce;
      osStub.calledOnce;
      writeFileStub.calledOnce;
      unlinkStub.calledOnce;
    });

    test('show error message if fail to starts a pipeline from yaml', async () => {
      executeStub.onFirstCall().resolves({error: null, stdout: JSON.stringify(pipelineWithEmptySpec), stderr: ''});
      executeStub.onSecondCall().resolves({stdout: JSON.stringify({items: pipelineResource}), error: ''});
      cliStub.onFirstCall().resolves({error: 'error', stdout: '', stderr: ''})
      await Pipeline.start(pipelineItem);
      showErrorMessageStub.calledOnce;
    });

    test('returns null if no pipeline selected', async () => {
      const result = await Pipeline.start(undefined);
      expect(result).equals(null);
    });

  });


  suite('about', () => {
    test('calls the proper tkn command in terminal', () => {
      Pipeline.about();

      expect(termStub).calledOnceWith(Command.printTknVersion());
    });
  });

  suite('refresh', () => {
    test('calls refresh on the explorer', () => {
      const stub = sandbox.stub(PipelineExplorer.prototype, 'refresh');
      Pipeline.refresh();
      expect(stub).calledOnce;
    });
  });

});
