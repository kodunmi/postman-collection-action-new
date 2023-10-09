// import * as core from '@actions/core'
// import * as glob from '@actions/glob'
// import {promises} from 'fs'
// import axios, {AxiosInstance, AxiosResponse} from 'axios'
// import {
//   LocalCollection,
//   RemoteCollection,
//   RemoteCollectionContainer
// } from './types'

// const localPostmanCollections: LocalCollection[] = []
// const localPostmanCollectionFileMap: Map<string, string> = new Map()
// const remotePostmanCollectionsMap: Map<string, RemoteCollection> = new Map()

// const restClient: AxiosInstance = axios.create({
//   baseURL: 'https://api.getpostman.com',
//   timeout: Number(core.getInput('postmanTimeout')) || 15000,
//   headers: {
//     'X-Api-Key': core.getInput('postmanApiKey')
//   }
// })

// const postmanWorkspaceId = core.getInput('postmanWorkspaceId')

// async function run(): Promise<void> {
//   try {
//     await Promise.all([
//       loadLocalPostmanCollections(),
//       loadRemotePostmanCollections()
//     ])

//     if (localPostmanCollections.length === 0) {
//       // No local postman collections found so exit early
//       return
//     }

//     await Promise.all(
//       localPostmanCollections.map(async (localCollection: LocalCollection) => {
//         try {
//           // const remoteCollection: RemoteCollection | undefined =
//           //   remotePostmanCollectionsMap.get(localCollection.info._postman_id)

//           let response: AxiosResponse<RemoteCollectionContainer>

//           // Collection not found in Remote Workspace so send a POST Request to create the collection
//           const createURi: string = postmanWorkspaceId
//             ? `/collections?workspace=${postmanWorkspaceId}`
//             : `/collections`
//           response = await restClient.post(createURi, {
//             collection: localCollection
//           })
//           if (
//             localCollection.info._postman_id !== response.data.collection.id
//           ) {
//             // IDs are different, update local file
//             const oldId: string = localCollection.info._postman_id
//             const localPath: string | undefined =
//               localPostmanCollectionFileMap.get(oldId)
//             if (localPath) {
//               localCollection.info._postman_id = response.data.collection.id
//               await promises.writeFile(
//                 localPath,
//                 JSON.stringify(localCollection, null, '\t')
//               )
//             }
//           }
//           localCollection.info._postman_id = response.data.collection.id

//           core.info(
//             `Successfully created collection ${response.data?.collection?.name} with Postman ID ${response.data?.collection?.id}`
//           )
//         } catch (error) {
//           core.error(
//             `Status ${error.response?.status} - Unable to process collection ${localCollection.info.name} with Postman ID ${localCollection.info._postman_id} due to: ${error.response?.data?.error?.message}`
//           )
//           core.setFailed(
//             `Errors processing Postman Collection(s) - Please see the output above`
//           )
//         }
//       })
//     )
//   } catch (error) {
//     core.setFailed(error.message)
//   }
// }

// async function loadRemotePostmanCollections(): Promise<void> {
//   try {
//     const {data} = await restClient.get('/collections')
//     for (const remoteCollection of data.collections.filter(
//       (collection: RemoteCollection) => !collection.fork
//     )) {
//       remotePostmanCollectionsMap.set(remoteCollection.id, remoteCollection)
//     }

//     core.info(
//       `${remotePostmanCollectionsMap.size} Non-Forked Collection(s) found for the given API Key in Remote Postman`
//     )
//   } catch (error) {
//     core.setFailed(
//       `Status ${error.response?.status} - Response: ${error.response?.data}`
//     )
//     throw new Error(`Unable to fetch Remote Collections from Postman Workspace`)
//   }
// }

// async function loadLocalPostmanCollections(): Promise<void> {
//   // Recursively search through the Repository files for JSON Files
//   const jsonPattern = `**/*.json`
//   const globber: glob.Globber = await glob.create(jsonPattern)
//   const files: string[] = []

//   for await (const file of globber.globGenerator()) {
//     // Store the file name(s)
//     files.push(file)
//   }

//   core.info(`${files.length} JSON File(s) Found`)

//   if (files.length === 0) {
//     return
//   }

//   // Wait for all files to be processed before progressing
//   await Promise.all(
//     files.map(async file => {
//       // Read the file content in memory and convert to JSON
//       try {
//         const jsonContent = JSON.parse(
//           (await promises.readFile(file)).toString()
//         )
//         // Check if the JSON file is a "valid" Postman v2.1 Collection, when true store in array
//         if (
//           jsonContent?.info?.schema ===
//           `https://schema.getpostman.com/json/collection/v2.1.0/collection.json`
//         ) {
//           localPostmanCollections.push(jsonContent)
//           localPostmanCollectionFileMap.set(jsonContent.info._postman_id, file)
//         }
//       } catch (e) {
//         // If JSON can't be parsed it's not valid so ignore
//       }
//     })
//   )

//   core.info(
//     `${localPostmanCollections.length} JSON Postman Collection(s) found`
//   )
// }

// run()

import * as core from '@actions/core'
import * as glob from '@actions/glob'
import {promises} from 'fs'
import axios, {AxiosInstance} from 'axios'
// import {AxiosInstance} from 'axios'
import {LocalCollection} from './types'

const localPostmanCollections: LocalCollection[] = []
const localPostmanCollectionFileMap: Map<string, string> = new Map()

const restClient: AxiosInstance = axios.create({
  baseURL: 'https://api.getpostman.com',
  timeout: Number(core.getInput('postmanTimeout')) || 15000,
  headers: {
    'X-Api-Key': core.getInput('postmanApiKey')
  }
})

// async function run(): Promise<void> {
//   try {
//     await loadLocalPostmanCollections('storage/app/postman')

//     if (localPostmanCollections.length === 0) {
//       // No local postman collections found so exit early
//       return
//     }

//     await Promise.all(
//       localPostmanCollections.map(async (localCollection: LocalCollection) => {
//         try {
//           // Send a POST Request to create the collection
//           const createURi: string = core.getInput('postmanWorkspaceId')
//             ? `/collections?workspace=${core.getInput('postmanWorkspaceId')}`
//             : `/collections`
//           const response = await restClient.post(createURi, {
//             collection: localCollection
//           })

//           core.info(
//             `Successfully created collection ${response.data?.collection?.name} with Postman ID ${response.data?.collection?.id}`
//           )
//         } catch (error) {
//           core.error(
//             `Error creating collection: ${error.response?.status} - ${error.response?.data?.error?.message}`
//           )
//           core.setFailed(
//             `Errors processing Postman Collection(s) - Please see the output above`
//           )
//         }
//       })
//     )
//   } catch (error) {
//     core.setFailed(error.message)
//   }
// }

// ...

async function run(): Promise<void> {
  try {
    await loadLocalPostmanCollections('storage/app/postman')

    if (localPostmanCollections.length === 0) {
      // No local postman collections found so exit early
      return
    }

    await Promise.all(
      localPostmanCollections.map(async (localCollection: LocalCollection) => {
        try {
          // Send a POST Request to create the collection
          const createURi: string = core.getInput('postmanWorkspaceId')
            ? `/collections?workspace=${core.getInput('postmanWorkspaceId')}`
            : `/collections`

          // Fetch the list of existing collections
          const {data: existingCollections} = await restClient.get(
            '/collections'
          )

          core.info(`collections exists: ${existingCollections.name}`)

          // Check if a collection with the same name exists
          const existingCollection = existingCollections.find(
            (collection: {name: string}) =>
              collection.name === localCollection.info.name
          )

          // Delete the existing collection if it exists
          if (existingCollection) {
            core.info(`Collection exists ${existingCollection.id}`)
            const deleteUri = `/collections/${existingCollection.id}`
            await restClient.delete(deleteUri)
            core.info(`Deleted existing collection: ${existingCollection.name}`)
          }

          // Create the new collection
          const response = await restClient.post(createURi, {
            collection: localCollection
          })

          core.info(
            `Successfully created collection ${response.data?.collection?.name} with Postman ID ${response.data?.collection?.id}`
          )
        } catch (error: any) {
          core.error(`Error creating collection: ${error} - ${error}`)
          core.setFailed(
            `Errors processing Postman Collection(s) - Please see the output above`
          )
        }
      })
    )
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

// ...

async function loadLocalPostmanCollections(folder: string): Promise<void> {
  // Search for JSON files in the specified folder
  const jsonPattern = `${folder}/**/*.json`
  const globber: glob.Globber = await glob.create(jsonPattern)
  const files: string[] = []

  for await (const file of globber.globGenerator()) {
    // Store the file name(s)
    files.push(file)
  }

  core.info(`${files.length} JSON File(s) Found in ${folder}`)

  if (files.length === 0) {
    return
  }

  // Wait for all files to be processed before progressing
  await Promise.all(
    files.map(async file => {
      // Read the file content in memory and convert to JSON
      try {
        const jsonContent = JSON.parse(
          (await promises.readFile(file)).toString()
        )
        // Check if the JSON file is a "valid" Postman v2.1 Collection, when true store in array
        if (
          jsonContent?.info?.schema ===
          `https://schema.getpostman.com/json/collection/v2.1.0/collection.json`
        ) {
          localPostmanCollections.push(jsonContent)
          localPostmanCollectionFileMap.set(jsonContent.info._postman_id, file)
        }
      } catch (e) {
        // If JSON can't be parsed, it's not valid, so ignore
      }
    })
  )

  core.info(
    `${localPostmanCollections.length} JSON Postman Collection(s) found in ${folder}`
  )
  core.info(
    `${localPostmanCollections.length} JSON Postman Collection(s) found in ${folder}`
  )
}

run()
