//import {Observer, Subject} from './interfaces'
class View {
    constructor(controller) {
        this.controller = controller;
        this.display();
        $('#newbookmark').click(() => {
            let newTitle;
            let newURL;
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                newTitle = tabs[0].title;
                newURL = tabs[0].url;
                let newBookmark = new Bookmark(newTitle, newURL, this.controller.getCurrentFolderObj());
                this.acceptNewBookmark(newBookmark);
            });
        });
        $('#newfolder').click(() => {
            let newFolder = new Folder($('#newfoldername').val().toString(), this.controller.getCurrentFolderObj());
            this.controller.addFolderObj(newFolder);
            $('#newfoldername').val('');
        });
        $('#open').click(() => {
        });
        $('#delete').click(() => {
        });
    }
    acceptNewBookmark(bookmark) {
        this.controller.addFolderObj(bookmark);
    }
    display() {
        $('html').height(500);
        let current = this.controller.getCurrentFolderObj();
        if (current === this.controller.getRootFolderObj()) {
            $('#selectable-1').append("<li id=\"1\" class=\"ui-widget-content\">" + current.getTitle() + "</li><br>");
        }
        else {
            let visibleButtons = "<li id=\"1\" class=\"ui-widget-content\">..</li><br>";
            let index = 2;
            for (let visible of current.getChildren()) {
                visibleButtons += "<li id=\"" + index + "\" class=\"ui-widget-content\">" + visible.getTitle() + "</li><br>";
            }
            $('#selectable-1').append(visibleButtons);
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
        return this.model.getRootFolderObj();
    }
    getCurrentFolderObj() {
        return this.model.getCurrentFolderObj();
    }
    setSelected(index) {
        this.model.setSelected(index);
    }
    openSelected() {
        this.model.notifyAll();
        return this.model.openSelected();
    }
    deleteSelected() {
        this.model.deleteSelected();
        this.model.notifyAll();
    }
    addFolderObj(obj) {
        this.model.addFolderObj(obj);
        this.model.notifyAll();
    }
}
class Model {
    constructor(root) {
        this.root = root;
        this.views = [];
        chrome.storage.sync.get("root", obj => {
            let prevRoot = obj["root"];
            console.log(prevRoot);
            if (prevRoot.title === root.getTitle()) {
                this.createTree(prevRoot);
            }
        });
        this.current = this.root;
    }
    createTree(object) {
        console.log("DICKSKSKSKSK");
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
        let selectedChildren = this.selected.getChildren();
        let returnObject = this.selected.open();
        if (selectedChildren) {
            this.current = this.selected;
        }
        this.selected = null;
        return returnObject;
    }
    deleteSelected() {
        this.current.deleteChild(this.selected);
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
        chrome.storage.sync.set({ "root": this.root });
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
    addChild(object) { }
    deleteChild(object) { }
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
        this.url = "not_a_url";
    }
    addChild(object) {
        this.innerObjects.push(object);
    }
    deleteChild(object) {
        let index = this.innerObjects.indexOf(object);
        this.innerObjects.splice(index, 1);
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
let model = new Model(new Folder("My Bookmarks"));
let controller = new Controller(model);
let view = new View(controller);
model.registerObserver(view);
