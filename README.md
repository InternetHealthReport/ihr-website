<p align="center"><img src="https://avatars.githubusercontent.com/u/40665700?s=200&v=4" height="100"></p>
<h1 align="center">IHR Website</h1>
<p align="center">
The Internet Health Report monitors the conditions of networks that compose the Internet. This effort aims to provide network operators, policymakers, and other stakeholders, with a better understanding of the Internet's infrastructure and its evolution. To understand further click <a href="https://www.ihr.live/">here</a>.
</p>

## Prerequisites to run

#### Install Node JS

Install [Node v24.11.0 (LTS)](https://nodejs.org/en/blog/release/v24.11.0)

#### Install NPM package manager

Install [NPM v11.6.1](https://docs.npmjs.com/cli/v11/configuring-npm)

#### Cloning and Running the Application in local

Clone the project

```bash
git clone https://github.com/InternetHealthReport/ihr-website.git
cd ihr-website
```
Note: 
- you can use [NVM](https://github.com/nvm-sh/nvm) to switch between node versions as per your need 

#### Configure the frontend

The application reads browser-visible runtime settings from `public/config.json`. Copy or edit it as needed:

```json
{
  "DEFAULT_LOCALE": "en",
  "FALLBACK_LOCALE": "en",
  "SUPPORTED_LOCALES": ["en", "jp"],
  "BASE_URL": "/",
  "CARTO_BASEMAPS_API_KEY": "your-api-key-here"
}
```

Do not store secrets in this file. Runtime configuration is downloaded by the browser and is visible to every website visitor.
The included `public/robots.txt` asks compliant search-engine crawlers not to index `/config.json`, but it does not prevent anyone from accessing the file.

#### Add a new runtime configuration variable

To add a variable in the future:

1. Add the variable and a safe development default to `public/config.json`:

   ```json
   {
     "EXAMPLE_SERVICE_URL": "https://example.test/api"
   }
   ```

2. Add validation for it in `src/config.js`. Make the property required when the application cannot work without it, or provide a safe default when it is optional.

3. Read it in application code only through `getConfig()`:

   ```js
   import { getConfig } from '@/config'

   const serviceUrl = getConfig().EXAMPLE_SERVICE_URL
   ```

   Do not use `import.meta.env` for a deployment-time value. Also avoid calling `getConfig()` from a module that is statically imported before `loadConfig()` completes; configuration-dependent startup modules must be dynamically imported after `loadConfig()`, as in `src/main.js`.

4. Add the property to the production Ansible template:

   ```jinja2
   {
     "EXAMPLE_SERVICE_URL": "https://example.test/api"
   }
   ```

After updating the mounted `config.json`, reload the page to pick up the new value. Application code changes still require building and deploying a new Docker image.

#### Install all the NPM packages.

```bash
npm install
```


#### For compilations and hot-reloads in development

```bash
npm run dev
```

#### To compile and minify for production run

```bash
npm run build
```

#### To format files

```bash
npm run format
```

## Deploy with Docker

To deploy the project with Docker, follow these steps:

#### Clone the project in localhost

```bash
git clone https://github.com/InternetHealthReport/ihr-website.git
cd ihr-website
```

#### Build the Docker Image

```bash
docker build -t ihr-website .
```

#### Run the Docker Container

```bash
docker run --name ihr-website -d -p <host-port>:80 \
  --mount type=bind,src=/absolute/path/to/config.json,dst=/usr/share/nginx/html/config.json,readonly \
  ihr-website
```

Replace `<host-port>` with the port on your host machine where you want to expose the application.
The mounted `config.json` can be changed for each deployment without rebuilding the image.

## Ways to contribute

Checkout [IHR Handbook for contributors](https://github.com/InternetHealthReport/gsoc/blob/main/ihr-contributor-handbook.md) for more info.
