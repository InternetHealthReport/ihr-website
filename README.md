<p align="center"><img src="https://avatars.githubusercontent.com/u/40665700?s=200&v=4" height="100"></p>
<h1 align="center">IHR Website</h1>
<p align="center">
The Internet Health Report monitors the conditions of networks that compose the Internet. This effort aims to provide network operators, policymakers, and other stakeholders, with a better understanding of the Internet's infrastructure and its evolution. To understand further click <a href="https://ihr.iijlab.net">here</a>.
</p>

## Prerequisites to run

#### Install Node JS

Install [Node v20.10.0 (LTS)](https://nodejs.org/en/blog/release/v20.10.0)

#### Install npm package manager

Install [Npm v10.2.4](https://docs.npmjs.com/cli/v10/configuring-npm)

#### Cloning and Running the Application in local

Clone the project

```bash
git clone https://github.com/InternetHealthReport/ihr-website.git
cd ihr-website
```
Note: 
- you can use [nvm](https://github.com/nvm-sh/nvm) to switch between node versions as per your need 

#### Install all the npm packages.

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

#### To lints and fixes files

```bash
npm run lint
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

First off, thanks for taking the time to contribute! 🎉🎉

Before you start, please follow these guidelines:

1. **Solve Existing Issues**: If you find an existing issue that you would like to work on, please discuss it with the maintainers before starting to solve it. This ensures that everyone is on the same page regarding the approach and scope of the solution.
2. **Create a New Issue**: If you have an idea for a new feature or have identified a bug that is not listed, please discuss it with the maintainers before creating a new issue. Providing context and details will help us understand the importance of your suggestion.
3. **Pull Requests (PRs)**: Please note that PRs that are not assigned to contributors and are not related to an open issue will be closed automatically.

Please refer to the project's style and contribution guidelines for submitting patches and additions. In general, we follow the "fork-and-pull" Git workflow. The basic workflow:

1. **Fork** the repo on GitHub
2. **Clone** the project to your own machine
3. Create a **branch** and name it with the `issue number`
4. **Commit** changes to the branch
5. **Push** your work back to your fork
6. **Rebase** your branch with the `dev` branch
7. Submit your **Pull Request** so that we can review it

Please submit your issues and pull request while following the automated template. During the contributing phase abide by the [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).
