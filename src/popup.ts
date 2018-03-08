import * as $ from 'jquery';

class View {
  private currentFolder:FolderObject;
  private selected:FolderObject = null;

  constructor(private rootFolder:FolderObject){
    this.currentFolder = rootFolder;
    this.display();
    $('#newbookmark').click(()=>{
      chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
        let newTab:chrome.tabs.Tab = tabs[0];
        let newBookmark:FolderObject = new Bookmark(newTab.title, newTab.url, this.currentFolder);
      });
    });

    $('#newfolder').click(()=>{
      let newFolder:FolderObject = new Folder($('#foldername').val().toString(), this.currentFolder);
      
    });

    $('#open').click(()=>{
      
    });

    $('#delete').click(()=>{
      
    });
  }

  public display():void {
    let parent:FolderObject|undefined = this.currentFolder.getParentObject();
    if (parent) {
      let visibleButtons:string = "<li id=\"1\"class=\"ui-widget-content\">..</li><br>";
      let index:number = 2;
      for (let folderObj of parent.getInnerObjects()) {
        visibleButtons += "<li id=\"" + index + "\" class=\"ui-widget-content\">" + folderObj.getTitle() + "</li><br>";
      }
      $('#selectable').append(visibleButtons);
    } else {
      $('#selectable').append("<li id=\"1\" class=\"ui-widget-content\">" + this.currentFolder.getTitle() + "</li><br>")
    }
  }
}

interface FolderObject {
  addObject(object:FolderObject):boolean;
  deleteObject(object:FolderObject):boolean;
  openObject(object:FolderObject):FolderObject[] | string;
  getParentObject():FolderObject | undefined;
  getInnerObjects():FolderObject[] | null;
  getTitle():string;
}

class Bookmark implements FolderObject {
  constructor(private title:string, private url:string, private parent:FolderObject) {}

  addObject(object:FolderObject):boolean {
    return false;
  }

  deleteObject(object:FolderObject):boolean {
    return false;
  }

  openObject(object:FolderObject):FolderObject[] | string {
    return this.url;
  }

  getParentObject():FolderObject {
    return this.parent;
  }

  getInnerObjects():FolderObject[] | null {
    return null;
  }

  getTitle():string {
    return this.title;
  }
}

class Folder implements FolderObject {
  private innerObjects:FolderObject[] = [];

  constructor(private title:string, private parent?:FolderObject) {}

  addObject(object:FolderObject):boolean {
    this.innerObjects.push(object);
    return true;
  }

  deleteObject(object:FolderObject):boolean {
    let index:number = this.innerObjects.indexOf(object);
    if (index === -1) {
      return false;
    }
    this.innerObjects.splice(index, 1);
    return true;
  }

  openObject(object:FolderObject):FolderObject[] | null {
    if (this.innerObjects.length === 0) {
      return null;
    }
    return this.innerObjects;
  }

  getParentObject():FolderObject {
    return this.parent;
  }

  getInnerObjects():FolderObject[] | null {
    return this.innerObjects;
  }

  getTitle():string {
    return this.title;
  }
}

let view:View = new View(new Folder("My Folders"));