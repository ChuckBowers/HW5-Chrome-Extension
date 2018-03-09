export interface Observer {
    notify():void;
}

export interface Subject {
    notifyAll():void;
    registerObserver(observer:Observer):void
    removeObserver(observer:Observer):void
}