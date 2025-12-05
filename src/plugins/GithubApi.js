import axios from 'axios'
import cache from './cache.js'
import { get } from 'idb-keyval'

/// Default timeout before api call are considered failed
const DEFAULT_TIMEOUT = 180000

const axios_base = axios.create({
  timeout: DEFAULT_TIMEOUT
})

const GithubApi = {
  install: (app, options) => {
    const get_repo = async (repo_url) => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      return await cache(
        `${repo_url}`,
        () => {
          return axios_base.get(repo_url)
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    }

    const get_file = async (file_url) => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      return await cache(
        `${file_url}`,
        () => {
          return axios_base.get(file_url)
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    }

    const github_api = {
      get_repo,
      get_file
    }

    app.provide('github_api', github_api)
  }
}

export { GithubApi }
