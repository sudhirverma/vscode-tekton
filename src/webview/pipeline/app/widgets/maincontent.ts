/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { createDiv } from '../../../common/dom-util';
import { debounce } from 'debounce';
import { Listener, BaseWidget, Widget } from '../../../common/widget';

export class LabelItem extends BaseWidget {
  constructor(title: string, id?: string) {
    super();
    this.element = createDiv('editorLabel');
    this.element.id = id ?? '';
    this.element.innerText = title;
  }
}

export class EditItem extends BaseWidget {

  constructor(title: string,
    input: Widget,
    id?: string,
    className?: string,
    elementId?: string,
    label?: boolean) {
    super();
    this.element = createDiv(className ?? 'editItem');
    this.element.id = elementId ?? '';
    !label ? this.element.appendChild(new LabelItem(title, id).getElement()) : undefined;
    this.element.appendChild(input.getElement());
  }
}

export class GroupItem extends BaseWidget {
  public label: HTMLLabelElement;
  constructor(private title: string, idName?: string) {
    super();
    this.element = createDiv('editorGroup');
    this.label = document.createElement('label');
    this.label.innerText = title;
    this.element.id = idName ?? '';
    this.element.appendChild(this.label);
  }

  addEditItem(item: EditItem): void {
    this.element.appendChild(item.getElement());
  }

  getName(): string {
    return this.title;
  }
}

export class Editor extends BaseWidget {

  private selectedGroup: GroupItem;

  private children: GroupItem[] = [];
  private selectionListener: Listener<GroupItem>;

  private update = debounce(this.updateSelection.bind(this), 10);

  constructor() {
    super();
    this.element = document.createElement('div');
    this.element.className = 'main';
    this.element.onscroll = () => {
      this.update();
    };
  }

  addGroup(group: GroupItem): void {
    this.children.push(group);
    this.element.appendChild(group.getElement());
    this.update();
  }

  updateSelection(): void {
    let h = 0;
    let selected: GroupItem;
    for (const child of this.children) {
      const el = child.getElement();
      h += el.offsetHeight;
      if (h === 0 && this.element.scrollTop === 0) {
        selected = child;
        break;
      }
      if (h >= this.element.scrollTop + 40) {
        selected = child;
        break;
      }
    }

    if (selected && this.selectedGroup !== selected) {
      this.selectedGroup = selected;
      if (this.selectionListener) {
        this.selectionListener(selected);
      }
    }
  }

  addSelectionListener(listener: Listener<GroupItem>): void {
    this.selectionListener = listener;
  }
}
