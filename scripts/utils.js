
export function setCookie(name, value, exp) {
    value = escape(value);
    var d = new Date();
    d.setTime(d.getTime() + (exp*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

export function getCookie(name) {
    name += "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            var rtnstr = c.substring(name.length, c.length);
            return unescape(rtnstr);
        }
    }
    console.log("Couldn't get cookie");
    return "";
}

// TODO add these as static functions to game class
export function error(message) {
    throw new Error("[game.js]: " + message);
}

export function log(message) {
    console.log("Log: " + message);
}

export function addEvent(element, eventName, callback) {
    if (element.addEventListener) {
        element.addEventListener(eventName, callback, false);
    } else if (element.attachEvent) {
        element.attachEvent("on" + eventName, callback);
    } else {
        element["on" + eventName] = callback;
    }
}

export function addChild(parent, id, type) {
    var newEle = document.createElement(type);
    newEle.id = id;
    parent.appendChild(newEle);
    return newEle;
}

export function deepClone(copyObject) {
    return Object.assign(Object.create(Object.getPrototypeOf(copyObject)), copyObject);
}

export function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end <= start + ms) {
     end = new Date().getTime();
  }
}

export async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

