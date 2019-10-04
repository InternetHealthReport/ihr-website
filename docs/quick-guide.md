# Quick guide
This guide purpose is to help maintainers to get used as quick as possible with the technologies used.

## Prerequisites
This guide cannot cover all missing knowledge so where a list to basic stuff:
* **es6 javascript**: https://github.com/lukehoban/es6features
* **vuejs**: https://vuejs.org/v2/guide/
* **CSS stylus**: http://stylus-lang.com/

## Plugins
### vue-fragment
permit to have multiple elements as root of a template
https://www.npmjs.com/package/vue-fragments

## Quasar UI
You can take a look here https://quasar.dev/introduction-to-quasar, but this
guide summarize some simple stuff for maintenance.

### Component configuration

*src/quasar.js* contains all loaded components. If some used components are missing you can probably see some weird locking stuff.
check that the corresponding component is loaded and it's directive are loaded it's quasar page (e.g. https://quasar.dev/vue-components/ajax-bar, installation section)

### Layout
Whenever possible the Flex Grid layout it's utilized. Briefly it consists in
rows and columns (cols) elements. The row (class="row") is divided in 12 cols and the default behavior
it's to wrap (moving to below row) cols (class="col") that cannot fit in those 12.
A col can span into multiple cols (col-\[n\]) and can be defined differently for different
viewport (col-\[vp\]-\[n\]).
The full reference is in the quasar website https://quasar.dev/layout/grid/introduction-to-flexbox.

### Icons
In this project is used Font Awesome https://fontawesome.com/.
To keep the number of different icons short, here a list of already used icons:
* **AS dependence** [*fas fa-project-diagram*](https://fontawesome.com/icons/project-diagram?style=solid)
* **Delay** [*fas fa-shipping-fast*](https://fontawesome.com/icons/shipping-fast?style=solid)
* **Disco** [*fas fa-plug*](https://fontawesome.com/icons/plug?style=solid)
* **arrow down**: [*fas fa-sort-down*](https://fontawesome.com/icons/sort-down?style=solid)
* **notification bell**: [*fas fa-bell*](https://fontawesome.com/icons/bell?style=solid)
* **magnifier**: [*fas fa-search*](https://fontawesome.com/icons/search?style=solid)
* **flag**: [*fas fa-flag*](https://fontawesome.com/icons/flag?style=solid)
* **network?**: [*fas fa-network-wired*](https://fontawesome.com/icons/network-wired?style=solid)
* **calendar**: [*fas fa-calendar-day*](https://fontawesome.com/icons/calendar-day?style=solid)
* **clock**: [*fas fa-clock"*](https://fontawesome.com/icons/clock?style=solid)
* **twitter**: [*fab fa-twitter-square*](https://fontawesome.com/icons/twitter-square?style=brands)
* **github**: [*fab fa-github-square*](https://fontawesome.com/icons/github-square?style=brands)
* **double arrow**: [*fas fa-angle-double-right*](https://fontawesome.com/icons/angle-double-right?style=solid)
* **email**: [*fas fa-envelope-square*](https://fontawesome.com/icons/envelope-square?style=solid)
* **menu**: [*fas fa-bars*](https://fontawesome.com/icons/bars?style=solid)
* **close**: [*fas fa-times*](https://fontawesome.com/icons/times?style=solid)
* **email**: [*far fa-envelope*](https://fontawesome.com/icons/envelope?style=regular)
* **visible**: [*far fa-eye*](https://fontawesome.com/icons/eye?style=regular)
* **hidden**: [*far fa-eye-slash*](https://fontawesome.com/icons/eye-slash?style=regular)
* **account**: [*fas fa-user-circle*](https://fontawesome.com/icons/user-circle?style=solid)

## Translations
if a view or a component has a few of unique elements to translate you can do
it directly into is file
You can use https://www.codeandweb.com/babeledit (one time payment)

## Routes
The structure of the urls contain the locale in use (*/:locale/...*)".
The simplest way to take this in account in routes is [named routes](https://router.vuejs.org/guide/essentials/named-routes.html).
briefly:
* name all routes in *router.js* file, and prepend routerBase to each route
* when routing (using either \<router-link\> or router.update()) use the name. This will prevent te change of the parameters
