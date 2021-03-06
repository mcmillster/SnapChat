import * as firebase from 'firebase'
import RNFetchBlob from 'react-native-fetch-blob'

export default function uploadImageToFirebase ({imageUri, timer}, fromUser, toUser) {
  /* shit needed for sending */
  const polyfill = RNFetchBlob.polyfill
  window.XMLHttpRequest = polyfill.XMLHttpRequest
  window.Blob = polyfill.Blob

  return new Promise(function (resolve, reject) {
    /* db links */
    let dbUserRef = firebase.database().ref().child('snaps/' + toUser)

    /* storage stuff */
    var storageRef = firebase.storage().ref()
    let userFolderRef = storageRef.child('userSnaps').child(toUser)

    let path = imageUri
    let imageName = imageUri.match(/[^/.]+.jpg/)[0]
    Blob
        .build(RNFetchBlob.wrap(path), { type: 'image/jpeg' })
        .then((blob) => {
          return userFolderRef
                  .child(imageName)
                  .put(blob, { contentType: 'image/jpeg' })
        })
        .then((snapshot) => {
          let snapObject = {}
          snapObject[fromUser] = {}
          let imageNameUrl = imageName.replace('.jpg', '')
          snapObject[fromUser][imageNameUrl] = {
            timer: timer,
            from: fromUser,
            imageName: imageName,
            date: Date.now()
          }
          return dbUserRef.push(snapObject)
        })
         .then(() => resolve('success'))
         .catch((err) => { reject(err) })
  })
}

export function saveToStory ({imageUri, timer}) {
  const polyfill = RNFetchBlob.polyfill
  window.XMLHttpRequest = polyfill.XMLHttpRequest
  window.Blob = polyfill.Blob

  return new Promise(function (resolve, reject) {
    let currentUid = firebase.auth().currentUser.uid
    // db ref
    let dbSnapStoryRef = firebase.database().ref().child('stories/' + currentUid)

    // Create a storage reference
    var storageRef = firebase.storage().ref()
    var snapStoryRef = storageRef.child('stories').child(currentUid)

    let path = imageUri
    let imageName = imageUri.match(/[^/.]+.jpg/)[0]
    Blob.build(RNFetchBlob.wrap(path), { type: 'image/jpeg' })
        .then((blob) => snapStoryRef
                .child(imageName)
                .put(blob, { contentType: 'image/jpeg' })
        )
        .then((snapshot) => {
          let snapObject = {}
          let imageNameUrl = imageName.replace('.jpg', '')
          navigator.geolocation.getCurrentPosition(
            ({coords, timestamp}) => {
              snapObject[imageNameUrl] = {
                timer,
                date: Date.now(),
                imageName,
                coords: {
                  latitude: coords.latitude,
                  longitude: coords.longitude
                }
              }
              return dbSnapStoryRef.push(snapObject)
            },
          (err) => console.log(err),
          {}
        )
        })
        .then((snapshot) => { resolve('success') })
        .catch((err) => { reject(err) })
  })
}

export const uploadImageToMemories = (imageUri, fromUser) => {
  const polyfill = RNFetchBlob.polyfill
  window.XMLHttpRequest = polyfill.XMLHttpRequest
  window.Blob = polyfill.Blob

  const storageRef = firebase.storage().ref().child('memories')
  const randomImageNumber = Math.floor(Math.random() * 100000) + 1
  const imageUrl = `${randomImageNumber}.jpg`

  return Blob.build(RNFetchBlob.wrap(imageUri), { type: 'image/jpeg' })
    .then((blob) => storageRef.child(`${fromUser}/${imageUrl}`).put(blob, { type: 'image/jpeg' }))
    .then(() => storageRef.child(fromUser).child(imageUrl).getDownloadURL())
    .catch(error => console.log('error sending message to chat', error))
}
