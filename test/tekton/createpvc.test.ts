/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/


'use strict';

import * as os from 'os';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import { cli } from '../../src/cli';
import * as yaml from 'js-yaml';
import * as fs from 'fs-extra';
import { createPvc } from '../../src/tekton/createpvc';

const expect = chai.expect;
chai.use(sinonChai);

suite('Tekton/Clustertask', () => {
  const sandbox = sinon.createSandbox();
  let osStub: sinon.SinonStub;
  let writeFileStub: sinon.SinonStub;
  let unlinkStub: sinon.SinonStub;
  let safeDumpStub: sinon.SinonStub;


  setup(() => {
    sandbox.stub(cli, 'execute').resolves({ error: null, stdout: 'successful', stderr: '' });
    osStub = sandbox.stub(os, 'tmpdir').returns('path');
    writeFileStub = sandbox.stub(fs, 'writeFile').resolves();
    unlinkStub = sandbox.stub(fs, 'unlink').resolves();
    safeDumpStub = sandbox.stub(yaml, 'safeDump').returns('empty');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('return null if new pvc content not available', async () => {
    const result = await createPvc([]);
    expect(result).equals(null);
  });

  test('create new pvc', async () => {
    await createPvc([{
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: {
        name: 'test'
      },
      spec: {
        accessMode: ['ReadWriteOnce'],
        resources: {
          requests: {
            storage: '1Mi'
          }
        },
        volumeMode:'Filesystem'
      }
    }]);
    safeDumpStub.calledOnce;
    osStub.calledOnce;
    writeFileStub.calledOnce;
    unlinkStub.calledOnce;
  });


});
