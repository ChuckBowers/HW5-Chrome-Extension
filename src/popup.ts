interface Observer {
    notify():void;
}

interface Subject {
    notifyAll():void;
    registerObserver(observer:Observer):void
    removeObserver(observer:Observer):void
}

// visual representation of the data, communicates with Model via Observer pattern
class View implements Observer {
    private currentPageAdded:boolean = false;

    constructor(private controller:Controller) {
        // getting the current page URL (page popup is opened in)
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            $('#currentTab').val("" + tabs[0].title + "|" + tabs[0].url);
        });

        $('#newbookmark').click(()=> {
            this.newBookmark();
        });

        $('#showbookmarks').click(() => {
            this.showBookmarks();
        });

        $('#search').click(()=>{
            this.search();
        });

        $('#delete').click(()=>{
            this.delete();
        });
  }

  private newBookmark():void {
    let thisPage:string = $('#currentTab').val().toString();
    let pageInfo:string[] = thisPage.split('|');
    let newBookmark:FolderObject = new Bookmark(pageInfo[0], pageInfo[1]);
    if (!(this.currentPageAdded)) {
        this.controller.addFolderObj(newBookmark);
        this.currentPageAdded = true;
    }
  }

  private showBookmarks():void {
    this.display();
  }

  private search():void {
    let searchValue:string = $('#searchvalue').val().toString();
    $('#searchvalue').val('');
    this.controller.searchFolderObj(searchValue);
  }

  private delete():void {
    this.controller.deleteAllObj();
    this.currentPageAdded = false;
  }

  public display():void {
    $('#links').contents().remove();
    let folderObjs:FolderObject[] = this.controller.getFolderObjs();
    let visibleButtons:string = "";
    for (let visible of folderObjs) {
        visibleButtons += "<a href=\"" + visible.open() + "\">" + visible.getTitle() + "</a><br>";
    }
    $('#links').append(visibleButtons);
  }

  public notify():void {
      this.display();
  }
}

// controller intermediary between View and Model
class Controller {
    constructor(private model:Model) {}

    public deleteAllObj():void {
        this.model.deleteAllObj();
        this.model.notifyAll();
    }

    public searchFolderObj(searchValue:string) {
        this.model.searchFolderObj(searchValue);
        this.model.notifyAll();
    }

    public addFolderObj(obj:FolderObject):void {
        this.model.addFolderObj(obj);
        this.model.notifyAll();
    }

    public getFolderObjs():FolderObject[] {
        return this.model.getFolderObjs();
    }

}

// represents data and communicates with View via Observer pattern
class Model implements Subject {
    private views:Observer[] = [];
    private selected:FolderObject;
    private viewableObjs:FolderObject[] = [];
    

    constructor(private root:Folder) {
        // retrieving the data from Chrome storage, ensures data is persistant
        // between windows
        chrome.storage.sync.get("root", obj => {
            let prevRoot = obj["root"];
            if (prevRoot && prevRoot.title === root.getTitle()) {
                // previous data found
                this.root = this.createBookmarks(prevRoot);
            } else {
                // no previous data found
                this.root = new Folder(root.getTitle());
            }
            this.viewableObjs = this.root.getFolderObjs();
        });
    }

    // creates FolderObject objects from array stored
    // in Chrome storage
    private createBookmarks(root):Folder {
        let newRoot:Folder = new Folder(root.title);
        
        for (let obj of root.innerObjects) {
            let newFolderObj:FolderObject = new Bookmark(obj.title, obj.url);
            newRoot.addFolderObj(newFolderObj);
        }

        return newRoot;
    }

    public deleteAllObj():void {
       this.viewableObjs = [];
    }

    public searchFolderObj(searchValue:string):void {
        let allObj:FolderObject[] = this.root.getFolderObjs();
        this.viewableObjs = [];

        for (let obj of allObj) {
            // assigning FolderObjects matching given string
            let title:string = obj.getTitle().toLowerCase();
            if (title.indexOf(searchValue.toLowerCase()) != -1) {
                this.viewableObjs.push(obj);
            }
        }
        // if not string given all values displayed
        if (searchValue == "") {
            this.viewableObjs = this.root.getFolderObjs();
        }
    }

    public addFolderObj(newObj:FolderObject):void {
        let folderObjs:FolderObject[] = this.root.getFolderObjs();
    
        this.root.addFolderObj(newObj);
    }

    public getFolderObjs():FolderObject[] {
        return this.viewableObjs;
    }

    public registerObserver(observer:Observer) {
        this.views.push(observer);
    }

    public removeObserver(observer:Observer):void {
        this.views.splice(this.views.indexOf(observer), 1);
      }
    
    public notifyAll():void {
        // saving data to Chrome storage
        chrome.storage.sync.set({"root":this.root});
        for (let view of this.views) {
            view.notify();
        }
    }
}

interface FolderObject {
  open():string;
  getTitle():string;
}

// individual bookmark objects that get displayed
class Bookmark implements FolderObject {
    private isBookmark:boolean = true;

    constructor(private title:string, private url:string) {}

    public open():string {
        return this.url;
    }

    public getTitle():string {
        return this.title;
    }
}

// contains Bookmarks/ objects of type FolderObject
class Folder {
    private innerObjects:FolderObject[] = [];

    constructor(private title:string) {}

    public getTitle():string {
        return this.title;
    }

    public addFolderObj(bookmark:FolderObject):void {
        this.innerObjects.push(bookmark);
    }

    public getFolderObjs():FolderObject[] {
        return this.innerObjects;
    }

    public deleteAllObj():void {
        this.innerObjects = [];
    }
}

// initiates JavaScript
let model = new Model(new Folder("My Bookmarks"));
let controller:Controller = new Controller(model);
let view:Observer = new View(controller);
model.registerObserver(view);