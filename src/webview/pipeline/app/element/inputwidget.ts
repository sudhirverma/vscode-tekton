/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { createDiv } from '../utils/util';
import { BaseWidget } from '../common/widget';
import { PipelineStart } from '../common/types';
import { TknResourceType } from '../utils/const';
import { parameter, createResourceJson } from '../common/resource';
import { disableButton } from '..';

export class InputWidget extends BaseWidget {
  public input: HTMLInputElement;
  constructor(text?: string,
    className?: string,
    public initialValue?: PipelineStart
  ) {
    super();
    const editorInput = createDiv(className ?? 'editor-input-box');
    this.input = document.createElement('input');
    this.input.classList.add('input');
    this.input.autocapitalize = 'off';
    this.input.spellcheck = false;
    this.input.placeholder = text ?? '';
    this.input.type = text;
    this.element = editorInput;
    const wrapper = createDiv('wrapper');
    wrapper.appendChild(this.input);
    this.input.oninput = () => this.getValue(this.input);
    this.input.onblur = () => this.validator();
    this.input.onfocus = () => this.removeError();
    editorInput.appendChild(wrapper);
  }

  removeError(): void {
    this.addSpaceInItem(this.input.parentNode.parentNode.parentElement);
    if (this.input.parentNode.parentNode.parentElement.lastElementChild.id === 'label-text-id') {
      this.input.parentNode.parentNode.parentElement.lastElementChild.remove();
    }
  }

  addSpaceInItem(addItemContent: HTMLElement, className?: string): void {
    if (addItemContent.id === 'items-section-workspace-new-item') {
      this.input.parentNode.parentNode.parentElement.className = className ?? '';
    }
  }

  validator(): void {
    if (!this.input.value) {
      this.addSpaceInItem(this.input.parentNode.parentNode.parentElement, 'items-section-workspace');
      const createLabel = document.createElement('label');
      createLabel.innerText = 'Required';
      createLabel.className = 'label-text';
      createLabel.id = 'label-text-id';
      this.input.parentNode.parentElement.className = 'editor-input-box-error';
      this.input.parentNode.parentNode.parentElement.appendChild(createLabel);
    } else {
      this.removeError();
      this.input.parentNode.parentElement.className = 'editor-input-box';
    }
  }

  getValue(input: HTMLInputElement): void {
    disableButton(document.getElementsByTagName('input'));
    const initialValue = this.initialValue;
    if (input.parentNode.parentNode.parentNode.parentElement.id === TknResourceType.Params) {
      parameter(input.parentNode.parentNode.parentNode.firstElementChild.id, this.input.value, initialValue);
    }
    const resource = input.parentNode.parentNode.parentNode.parentNode.parentElement.id.trim();
    if (resource === TknResourceType.GitResource || resource === TknResourceType.ImageResource) {
      const name = input.parentNode.parentNode.parentNode.parentNode.firstElementChild.id;
      const resourceRef = this.input.value;
      createResourceJson(name, resourceRef, this.initialValue);
    }
  }
}
