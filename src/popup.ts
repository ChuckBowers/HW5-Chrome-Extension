import {Observer, Subject} from './interfaces';

class View implements Observer {
    constructor(private controller:Controller) {
        $('html').height(280); 

        $('#newbookmark').click(()=> {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                let newTab:chrome.tabs.Tab = tabs[0];
                let newBookmark:FolderObject = new Bookmark(newTab.title, newTab.url, this.currentFolder);
                this.controller.addFolderObj(newBookmark);
            });
        });

        $('#newfolder').click(()=>{
            let newFolder:FolderObject = new Folder($('#newfoldername').val().toString(), this.controller.getCurrentFolderObj().getParent());
            this.controller.addFolderObj(newFolder);
        });

        $('#open').click(()=>{
            
        });

        $('#delete').click(()=>{
            
        });
  }

  public display():void {
    let parent:FolderObject|undefined = this.controller.getCurrentFolderObj();
    if (parent) {
      let visibleButtons:string = "<li id=\"1\"class=\"ui-widget-content\">..</li><br>";
      let index:number = 2;
      for (let folderObj of parent.getChildren()) {
        visibleButtons += "<li id=\"" + index + "\" class=\"ui-widget-content\">" + folderObj.getTitle() + "</li><br>";
      }
      $('#selectable').append(visibleButtons);
    } else {
      $('#selectable').append("<li id=\"1\" class=\"ui-widget-content\">" + this.currentFolder.getTitle() + "</li><br>")
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
        chrome.storage.sync.set({"root":root});
        this.current = root;
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
        let returnObject:FolderObject[]|string = this.selected.open();
        this.selected = null;
        return returnObject;
    }

    public deleteSelected():void {
        let selectedParent = this.selected.getParent();
        selectedParent.deleteChild(this.selected);
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
        for (let view of this.views) {
            view.notify();
        }
    }
}

interface FolderObject {
  addChild(object:FolderObject):boolean;
  deleteChild(object:FolderObject):boolean;
  open():FolderObject[] | string;
  getParent():FolderObject | undefined;
  getChildren():FolderObject[] | null;
  getTitle():string;
}

class Bookmark implements FolderObject {
  constructor(private title:string, private url:string, private parent:FolderObject) {}

  addChild(object:FolderObject):boolean {
    return false;
  }

  deleteChild(object:FolderObject):boolean {
    return false;
  }

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

  constructor(private title:string, private parent:FolderObject) {}

  addChild(object:FolderObject):boolean {
    this.innerObjects.push(object);
    return true;
  }

  deleteChild(object:FolderObject):boolean {
    let index:number = this.innerObjects.indexOf(object);
    if (index === -1) {
      return false;
    }
    this.innerObjects.splice(index, 1);
    return true;
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

//let view:View = new View(new Folder("My Folders"));