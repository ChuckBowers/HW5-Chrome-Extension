//import {Observer, Subject} from './interfaces'

interface Observer {
    notify():void;
}

interface Subject {
    notifyAll():void;
    registerObserver(observer:Observer):void
    removeObserver(observer:Observer):void
}

class View implements Observer {
    constructor(private controller:Controller) {
        this.display();

        $('#newbookmark').click(()=> {
            let newTitle:string;
            let newURL:string;
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                newTitle = tabs[0].title;
                newURL = tabs[0].url;
                let newBookmark:FolderObject = new Bookmark(newTitle, newURL, this.controller.getCurrentFolderObj());
                this.acceptNewBookmark(newBookmark);
            });
        });

        $('#newfolder').click(()=>{
            let newFolder:FolderObject = new Folder($('#newfoldername').val().toString(), this.controller.getCurrentFolderObj());
            this.controller.addFolderObj(newFolder);
            $('#newfoldername').val('');
        });

        $('#open').click(()=>{
            
        });

        $('#delete').click(()=>{
            
        });
  }

  private acceptNewBookmark(bookmark:FolderObject):void {
      this.controller.addFolderObj(bookmark);
  }

  public display():void {
    $('html').height(500);
    let current:FolderObject = this.controller.getCurrentFolderObj();
    if (current === this.controller.getRootFolderObj()) {
        $('#selectable-1').append("<li id=\"1\" class=\"ui-widget-content\">" + current.getTitle() + "</li><br>");
    } else {
        let visibleButtons:string = "<li id=\"1\" class=\"ui-widget-content\">..</li><br>";
        let index:number = 2;
        for (let visible of current.getChildren()) {
            visibleButtons += "<li id=\"" + index + "\" class=\"ui-widget-content\">" + visible.getTitle() + "</li><br>";
        }
        $('#selectable-1').append(visibleButtons);
    }
  }

  public notify():void {
      this.display();
  }
}


class Controller {
    constructor(private model:Model) {}

    public getRootFolderObj():FolderObject {
        return this.model.getRootFolderObj();
    }

    public getCurrentFolderObj():FolderObject {
        return this.model.getCurrentFolderObj();
    }

    public setSelected(index:number) {
        this.model.setSelected(index);
    }

    public openSelected():FolderObject[] | string {
        this.model.notifyAll();
        return this.model.openSelected();
    }

    public deleteSelected():void {
        this.model.deleteSelected();
        this.model.notifyAll();
    }

    public addFolderObj(obj:FolderObject):void {
        this.model.addFolderObj(obj);
        this.model.notifyAll();
    }

}

class Model implements Subject {
    private views:Observer[] = [];
    private current:FolderObject; // always a Folder object
    private selected:FolderObject;

    constructor(private root:FolderObject) {
        chrome.storage.sync.get("root", obj => {
            let prevRoot = obj["root"];
            console.log(prevRoot);
            if (prevRoot.title === root.getTitle()) {
                this.root = this.createTreeRoot(prevRoot);
            }
        });
        
        this.current = this.root;
    }

    private createTreeRoot(object):FolderObject {
        let treeRoot:FolderObject = new Folder(object.title);
        if (object.innerObjects.length > 0) {
            for (let obj of object.innerObjects) {
                treeRoot.addChild(this.fillTree(obj))
            }
        }
        return treeRoot;
    }

    private fillTree(object):FolderObject {
        if (object.isBookmark) {
            return new Bookmark(object.title, object.url);
        }

    }

    public getRootFolderObj():FolderObject {
        return this.root;
    }

    public getCurrentFolderObj():FolderObject {
        return this.current;
    }

    public setSelected(index:number):void {
        let visibleObjects:FolderObject[]|null = this.current.getChildren();
        if (visibleObjects) {
            this.selected = visibleObjects[index];
        }
    }

    public openSelected():FolderObject[] | string {
        let selectedChildren:FolderObject[]|null = this.selected.getChildren();
        let returnObject:FolderObject[]|string = this.selected.open();
        if (selectedChildren) {
            this.current = this.selected;
        }
        this.selected = null;
        return returnObject;
    }

    public deleteSelected():void {
        this.current.deleteChild(this.selected);
        this.selected = null;
    }

    public addFolderObj(obj:FolderObject):void {
        this.current.addChild(obj);
    }

    public registerObserver(observer:Observer) {
        this.views.push(observer);
    }

    public removeObserver(observer:Observer):void {
        this.views.splice(this.views.indexOf(observer), 1);
      }
    
    public notifyAll():void {
        chrome.storage.sync.set({"root":this.root});
        for (let view of this.views) {
            view.notify();
        }
    }
}

interface FolderObject {
  addChild(object:FolderObject):void;
  deleteChild(object:FolderObject):void;
  open():FolderObject[] | string;
  getParent():FolderObject | undefined;
  getChildren():FolderObject[] | null;
  getTitle():string;
}

class Bookmark implements FolderObject {
    private isBookmark:boolean = true;

  constructor(private title:string, private url:string, private parent?:FolderObject) {}

  addChild(object:FolderObject):void {}

  deleteChild(object:FolderObject):void {}

  open():FolderObject[] | string {
    return this.url;
  }

  getParent():FolderObject {
    return this.parent;
  }

  getChildren():FolderObject[] | null {
      return null;
  }

  getTitle():string {
    return this.title;
  }
}

class Folder implements FolderObject {
  private innerObjects:FolderObject[] = [];
  private isBookmark:boolean = false;

  constructor(private title:string, private parent?:FolderObject) {}

  addChild(object:FolderObject):void {
    this.innerObjects.push(object);
  }

  deleteChild(object:FolderObject):void {
    let index:number = this.innerObjects.indexOf(object);
    this.innerObjects.splice(index, 1);
  }

  open():FolderObject[] | string {
    return this.innerObjects;
  }

  getParent():FolderObject {
      return this.parent;
  }

  getChildren():FolderObject[] | null {
      if (this.innerObjects.length == 0) {
          return null;
      }
      return this.innerObjects;
  }

  getTitle():string {
    return this.title;
  }
}

let model = new Model(new Folder("My Bookmarks"));
let controller:Controller = new Controller(model);
let view:Observer = new View(controller);
model.registerObserver(view);