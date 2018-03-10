// visual representation of the data, communicates with Model via Observer pattern
class View {
    constructor(controller) {
        this.controller = controller;
        this.currentPageAdded = false;
        // getting the current page URL (page popup is opened in)
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            $('#currentTab').val("" + tabs[0].title + "|" + tabs[0].url);
        });
        $('#newbookmark').click(() => {
            this.newBookmark();
        });
        $('#showbookmarks').click(() => {
            this.showBookmarks();
        });
        $('#search').click(() => {
            this.search();
        });
        $('#delete').click(() => {
            this.delete();
        });
    }
    newBookmark() {
        let thisPage = $('#currentTab').val().toString();
        let pageInfo = thisPage.split('|');
        let newBookmark = new Bookmark(pageInfo[0], pageInfo[1]);
        if (!(this.currentPageAdded)) {
            this.controller.addFolderObj(newBookmark);
            this.currentPageAdded = true;
        }
    }
    showBookmarks() {
        this.display();
    }
    search() {
        let searchValue = $('#searchvalue').val().toString();
        $('#searchvalue').val('');
        this.controller.searchFolderObj(searchValue);
    }
    delete() {
        this.controller.deleteAllObj();
        this.currentPageAdded = false;
    }
    display() {
        $('#links').contents().remove();
        let folderObjs = this.controller.getFolderObjs();
        let visibleButtons = "";
        for (let visible of folderObjs) {
            visibleButtons += "<a href=\"" + visible.open() + "\">" + visible.getTitle() + "</a><br>";
        }
        $('#links').append(visibleButtons);
    }
    notify() {
        this.display();
    }
}
// controller intermediary between View and Model
class Controller {
    constructor(model) {
        this.model = model;
    }
    deleteAllObj() {
        this.model.deleteAllObj();
        this.model.notifyAll();
    }
    searchFolderObj(searchValue) {
        this.model.searchFolderObj(searchValue);
        this.model.notifyAll();
    }
    addFolderObj(obj) {
        this.model.addFolderObj(obj);
        this.model.notifyAll();
    }
    getFolderObjs() {
        return this.model.getFolderObjs();
    }
}
// represents data and communicates with View via Observer pattern
class Model {
    constructor(root) {
        this.root = root;
        this.views = [];
        this.viewableObjs = [];
        // retrieving the data from Chrome storage, ensures data is persistant
        // between windows
        chrome.storage.sync.get("root", obj => {
            let prevRoot = obj["root"];
            if (prevRoot && prevRoot.title === root.getTitle()) {
                // previous data found
                this.root = this.createBookmarks(prevRoot);
            }
            else {
                // no previous data found
                this.root = new Folder(root.getTitle());
            }
            this.viewableObjs = this.root.getFolderObjs();
        });
    }
    // creates FolderObject objects from array stored
    // in Chrome storage
    createBookmarks(root) {
        let newRoot = new Folder(root.title);
        for (let obj of root.innerObjects) {
            let newFolderObj = new Bookmark(obj.title, obj.url);
            newRoot.addFolderObj(newFolderObj);
        }
        return newRoot;
    }
    deleteAllObj() {
        this.viewableObjs = [];
    }
    searchFolderObj(searchValue) {
        let allObj = this.root.getFolderObjs();
        this.viewableObjs = [];
        for (let obj of allObj) {
            // assigning FolderObjects matching given string
            let title = obj.getTitle().toLowerCase();
            if (title.indexOf(searchValue.toLowerCase()) != -1) {
                this.viewableObjs.push(obj);
            }
        }
        // if not string given all values displayed
        if (searchValue == "") {
            this.viewableObjs = this.root.getFolderObjs();
        }
    }
    addFolderObj(newObj) {
        let folderObjs = this.root.getFolderObjs();
        this.root.addFolderObj(newObj);
    }
    getFolderObjs() {
        return this.viewableObjs;
    }
    registerObserver(observer) {
        this.views.push(observer);
    }
    removeObserver(observer) {
        this.views.splice(this.views.indexOf(observer), 1);
    }
    notifyAll() {
        // saving data to Chrome storage
        chrome.storage.sync.set({ "root": this.root });
        for (let view of this.views) {
            view.notify();
        }
    }
}
// individual bookmark objects that get displayed
class Bookmark {
    constructor(title, url) {
        this.title = title;
        this.url = url;
        this.isBookmark = true;
    }
    open() {
        return this.url;
    }
    getTitle() {
        return this.title;
    }
}
// contains Bookmarks/ objects of type FolderObject
class Folder {
    constructor(title) {
        this.title = title;
        this.innerObjects = [];
    }
    getTitle() {
        return this.title;
    }
    addFolderObj(bookmark) {
        this.innerObjects.push(bookmark);
    }
    getFolderObjs() {
        return this.innerObjects;
    }
    deleteAllObj() {
        this.innerObjects = [];
    }
}
// initiates JavaScript
let model = new Model(new Folder("My Bookmarks"));
let controller = new Controller(model);
let view = new View(controller);
model.registerObserver(view);
