"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const $ = require("jquery");
class View {
    constructor(rootFolder) {
        this.rootFolder = rootFolder;
        this.selected = null;
        this.currentFolder = rootFolder;
        // this.display();
        $('#newbookmark').click(() => {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
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
        let parent = this.currentFolder.getParentObject();
        if (parent) {
            let visibleButtons = "<li id=\"1\"class=\"ui-widget-content\">..</li><br>";
            let index = 2;
            for (let folderObj of parent.getInnerObjects()) {
                visibleButtons += "<li id=\"" + index + "\" class=\"ui-widget-content\">" + folderObj.getTitle() + "</li><br>";
            }
            $('#selectable').append(visibleButtons);
        }
        else {
            $('#selectable').append("<li id=\"1\" class=\"ui-widget-content\">" + this.currentFolder.getTitle() + "</li><br>");
        }
    }
}
class Bookmark {
    constructor(title, url, parent) {
        this.title = title;
        this.url = url;
        this.parent = parent;
    }
    addObject(object) {
        return false;
    }
    deleteObject(object) {
        return false;
    }
    openObject(object) {
        return this.url;
    }
    getParentObject() {
        return this.parent;
    }
    getInnerObjects() {
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
    addObject(object) {
        this.innerObjects.push(object);
        return true;
    }
    deleteObject(object) {
        let index = this.innerObjects.indexOf(object);
        if (index === -1) {
            return false;
        }
        this.innerObjects.splice(index, 1);
        return true;
    }
    openObject(object) {
        if (this.innerObjects.length === 0) {
            return null;
        }
        return this.innerObjects;
    }
    getParentObject() {
        return this.parent;
    }
    getInnerObjects() {
        return this.innerObjects;
    }
    getTitle() {
        return this.title;
    }
}
let view = new View(new Folder("My Folders"));
