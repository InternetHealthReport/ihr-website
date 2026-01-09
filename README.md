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
docker run --name ihr-website -d -p <host-port>:80 -t ihr-website
```

Replace `<host-port>` with the port on your host machine where you want to expose the application.

## Ways to contribute

Checkout [IHR Handbook for contributors](https://github.com/InternetHealthReport/gsoc/blob/main/ihr-contributor-handbook.md) for more info.
