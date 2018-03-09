"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class View {
    constructor(controller) {
        this.controller = controller;
        this.selected = null;
        $('html').height(280);
        $('#newbookmark').click(() => {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                let newTab = tabs[0];
                let newBookmark = new Bookmark(newTab.title, newTab.url, this.currentFolder);
            });
        });
        $('#newfolder').click(() => {
            let newFolder = new Folder($('#foldername').val().toString(), this.currentFolder);
        });
        $('#open').click(() => {
        });
        $('#delete').click(() => {
        });
    }
    display() {
        let parent = this.currentFolder.getParent();
        if (parent) {
            let visibleButtons = "<li id=\"1\"class=\"ui-widget-content\">..</li><br>";
            let index = 2;
            for (let folderObj of parent.getChildren()) {
                visibleButtons += "<li id=\"" + index + "\" class=\"ui-widget-content\">" + folderObj.getTitle() + "</li><br>";
            }
            $('#selectable').append(visibleButtons);
        }
        else {
            $('#selectable').append("<li id=\"1\" class=\"ui-widget-content\">" + this.currentFolder.getTitle() + "</li><br>");
        }
    }
    notify() {
        this.display();
    }
}
class Controller {
    constructor(model) {
        this.model = model;
    }
    getRootFolderObj() {
        this.model.notifyAll();
        return this.model.getRootFolderObj();
    }
}
class Model {
    constructor(root) {
        this.root = root;
        this.views = [];
        chrome.storage.sync.set({ "root": root });
        this.current = root;
    }
    getRootFolderObj() {
        return this.root;
    }
    getCurrentFolderObj() {
        return this.current;
    }
    setSelected(index) {
        let visibleObjects = this.current.getChildren();
        if (visibleObjects) {
            this.selected = visibleObjects[index];
        }
    }
    openSelected() {
        let returnObject = this.selected.open();
        this.selected = null;
        return returnObject;
    }
    deleteSelected() {
        let selectedParent = this.selected.getParent();
        selectedParent.deleteChild(this.selected);
        this.selected = null;
    }
    addFolderObj(obj) {
        this.current.addChild(obj);
    }
    registerObserver(observer) {
        this.views.push(observer);
    }
    removeObserver(observer) {
        this.views.splice(this.views.indexOf(observer), 1);
    }
    notifyAll() {
        for (let view of this.views) {
            view.notify();
        }
    }
}
class Bookmark {
    constructor(title, url, parent) {
        this.title = title;
        this.url = url;
        this.parent = parent;
    }
    addChild(object) {
        return false;
    }
    deleteChild(object) {
        return false;
    }
    open() {
        return this.url;
    }
    getParent() {
        return this.parent;
    }
    getChildren() {
        return null;
    }
    getTitle() {
        return this.title;
    }
}
class Folder {
    constructor(title, parent) {
        this.title = title;
        this.parent = parent;
        this.innerObjects = [];
    }
    addChild(object) {
        this.innerObjects.push(object);
        return true;
    }
    deleteChild(object) {
        let index = this.innerObjects.indexOf(object);
        if (index === -1) {
            return false;
        }
        this.innerObjects.splice(index, 1);
        return true;
    }
    open() {
        return this.innerObjects;
    }
    getParent() {
        return this.parent;
    }
    getChildren() {
        if (this.innerObjects.length == 0) {
            return null;
        }
        return this.innerObjects;
    }
    getTitle() {
        return this.title;
    }
}
//let view:View = new View(new Folder("My Folders")); 
