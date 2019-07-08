# Quick guide
This guide purpose is to help maintainers to get used as quick as possible with the technologies used.

## Prerequisites
This guide cannot cover all missing knowledge so where a list to basic stuff:
* HTML, CSS, Javascript
* **es6 javascript**: https://github.com/lukehoban/es6features
* **vuejs**: https://vuejs.org/v2/guide/

## Quasar UI
You can take a look here https://quasar.dev/introduction-to-quasar, but this guide summarize some simple stuff for maintenance.

### Component configuration

*src/quasar.js* contains all loaded components. If some used components are missing you can probably see some weird locking stuff.
check that the corresponding component is loaded and it's directive are loaded it's quasar page (e.g. https://quasar.dev/vue-components/ajax-bar, installation section)

### Icons
In this project is used Font Awesome https://fontawesome.com/.
To keep the number of different icons short there is a list of already used icons:

* **arrow down**: [*fas fa-sort-down*](https://fontawesome.com/icons/sort-down?style=solid)
* **squared plus**: [*fas fa-plus-square*](https://fontawesome.com/icons/plus-square?style=solid)
* **notification bell**: [*fas fa-bell*](https://fontawesome.com/icons/bell?style=solid)
* **magnifier** [*fas fa-search*](https://fontawesome.com/icons/search?style=solid)

### Translations
if a view or a component has a few of unique elements to translate you can do 
it directly into is file
You can use https://www.codeandweb.com/babeledit (one time payment)
