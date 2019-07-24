const SCRIPT_REGEXP = /src=('|")(.*(?=\1))/;
const LINK_REGEXP = /href=('|")(.*(?=\1))/;

class LibraryDelayer {
  constructor() {
    if (LibraryDelayer.prototype.documentWriteBackup != undefined)
      throw SyntaxError("only one instance of FakeDocument is possible!");

    LibraryDelayer.prototype.documentWriteBackup = document.write;
    LibraryDelayer.prototype.instance = this;
    this.scripts = [];
    this.links = [];
    this.promises = [];
  }

  addScript(link) {
    this.scripts.push(link);
    return this;
  }

  add(str) {
    if (str.startsWith("<script")) {
      this.scripts.push(SCRIPT_REGEXP.exec(str)[2]); //get url
      return;
    }
    if (str.startsWith("<link")) {
      this.links.push(str);
      return;
    }
    console.error("strange document write" + str);
    return this;
  }

  popScriptUrl() {
    if (this.scripts.length == 0) return null;
    return this.scripts.shift();
  }

  *linkUrlIterator() {
    while (this.links.length != 0) {
      let match = LINK_REGEXP.exec(this.links.shift());
      yield match[2];
    }
  }

  loadNext(body) {
    return new Promise(async resolve => {
      let script = this.popScriptUrl();
      if (script != null) {
        let scriptElem = document.createElement("script");
        scriptElem.src = script;
        let promise = new Promise(resolve => {
          scriptElem.onload = () => {
            resolve();
          };
          body.appendChild(scriptElem);
        });
        await promise;
        await this.loadNext(body);
      }
      resolve();
    });
  }

  write(str) {
    LibraryDelayer.prototype.instance.add(str);
  }

  init() {
    return new Promise(async (resolve, reject) => {
      try {
        this.start();
        var body = document.getElementsByTagName("body")[0];
        var head = document.getElementsByTagName("head")[0];

        await this.loadNext(body);

        for (const link of this.linkUrlIterator()) {
          let linkElem = document.createElement("link");
          linkElem.href = link;
          linkElem.rel = "stylesheet";
          this.promises.push(
            new Promise(resolve => {
              linkElem.onload = () => {
                resolve("link" + link);
              };
              head.appendChild(linkElem);
            })
          );
        }

        for (let i = 0; i < this.promises.length; i++) {
          await this.promises[i];
        }
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        this.restore();
      }
    });
  }

  start() {
    document.write = this.write;
  }

  restore() {
    document.write = LibraryDelayer.documentWriteBackup;
  }
}

export default {
  install(Vue, options) {
    let libraryDelayer = new Vue({
      data() {
        return {
          libraryDelayer: new LibraryDelayer(),
          libraryList: options.libraries
        };
      },
      mounted() {},
      methods: {
        load(library, callback) {
          let script = this.libraryList[library];
          if (script !== undefined) {
            this.libraryDelayer
              .addScript(script)
              .init()
              .then(() => {
                callback();
              });
          }
        }
      }
    });

    Vue.mixin({
      beforeCreate() {
        this.$libraryDelayer = libraryDelayer;
      }
    });
  }
};
