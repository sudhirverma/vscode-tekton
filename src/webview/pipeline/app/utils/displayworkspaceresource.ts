/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { disableSelection } from './disablebutton';
import { SelectWidget } from '../widgets/selectwidget';
import { EditItem } from '../widgets/maincontent';
import { VolumeTypes } from './const';
import { Trigger, PipelineStart } from './types';
import { selectText } from './util';
import { createItem } from './item';


export function triggerSelectedWorkspaceType(select: HTMLSelectElement, event: Node & ParentNode, trigger: Trigger, initialValue: PipelineStart, index?: number): void {
  const sectionId = `${select.value}-Workspaces`;
  const editId = 'Workspaces-Edit';
  if (trigger[select.value]) {
    dropdownForWorkspaceType(event, editId, sectionId, select, trigger, initialValue, index);
  } else if (event.lastElementChild.firstElementChild.id.trim() === editId) {
    event.lastElementChild.remove();
    disableSelection(document.getElementsByTagName('select'));
  }
}


function dropdownForWorkspaceType(event: Node & ParentNode, editId: string, sectionId: string, select: HTMLSelectElement, trigger: Trigger, initialValue: PipelineStart, index?: number): void {
  if (event.lastElementChild.firstElementChild.id.trim() === editId) event.lastElementChild.remove();
  const workspacesType = new SelectWidget(sectionId, trigger, null, initialValue).workspacesResource(trigger[select.value], select.value, index);
  const workspacesOp = new EditItem(VolumeTypes[select.value], workspacesType, editId, 'inner-editItem');
  event.appendChild(workspacesOp.getElement());
  selectText(event.querySelectorAll(`[id^=${sectionId}]`), `Select a ${VolumeTypes[select.value]}`, (index === undefined) ?? true, 'select-workspace-option');
  disableSelection(document.getElementsByTagName('select'));
}

export function createElementForKeyAndPath(selectedItem: unknown[] | NodeListOf<Element>, buttonItem: unknown[] | NodeListOf<Element>, event: Node & ParentNode, optionId: string, select: HTMLSelectElement, initialValue: PipelineStart, trigger: Trigger): void {
  if (selectedItem.length) {
    selectedItem.forEach((element: { remove: () => unknown }) => element.remove());
    buttonItem.forEach((element: { remove: () => unknown }) => element.remove());
    createItem(event, optionId, select.value, initialValue, trigger);
  } else {
    createItem(event, optionId, select.value, initialValue, trigger);
  }
}
