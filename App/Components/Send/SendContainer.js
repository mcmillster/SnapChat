import React, {Component, PropTypes} from 'react'
import {View, Text, ListView} from 'react-native'
import SendToFriends from './SendToFriends'
import SendRow, {seperatorFriends} from './SendRow'
import database, {authentication} from '../FireBase/FireBase'
import sendSnapToUser from './SendHelpers'
import MainContainer from '../Main/MainContainer'

class SendContainer extends Component {
  constructor (props) {
    super(props)
    console.log(props)
    let friendsDataSource = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    this.state = {
      friendsDataSource: friendsDataSource.cloneWithRows([]),
      friends: [],
      imageUri: this.props.imageUri,
      isSending: false,
      hasSent: false,
      sendError: false
    }

    this.selectFriend = this.selectFriend.bind(this)
    this.pressBack = this.pressBack.bind(this)
    this.send = this.send.bind(this)
  }

  componentDidMount () {
    this.retrieveFriends()
  }

  selectFriend (rowId) {
    var newFriends = []
    newFriends = this.state.friends.slice()
    newFriends[rowId] = {
      name: newFriends[rowId].name,
      highLighted: !newFriends[rowId].highLighted,
      key: newFriends[rowId].key
    }
    console.log(this.state.friends)
    this.setState({
      friends: newFriends,
      friendsDataSource: this.state.friendsDataSource.cloneWithRows(newFriends)
    })
  }

  send () {
    console.log('is sending')
    this.setState({
      isSending: true
    })
    Promise.all(
    this.state.friends.map((friendObject) => {
      console.log(friendObject)
      if (friendObject.highLighted) {
        return sendSnapToUser(this.props.imageUri, authentication.currentUser.uid, friendObject.key)
      }
    })
    )
    .then((res) => {
      this.setState({
        isSending: false,
        hasSent: true,
        sendError: false
      })

      setTimeout(() => {
        this.props.navigator.popToTop()
        this.setState({
          hasSent: false
        })
      }, 1500)
    })
    .catch((err) => {
      this.setState({
        isSending: false,
        hasSent: true,
        sendError: true
      })

      setTimeout(() => {
        this.props.navigator.popToTop()
        this.setState({
          hasSent: false,
          sendError: false
        })
      }, 1500)
    })
  }

  // Retrieves a list of friends from the fire base depending on the logged in UserID
  retrieveFriends () {
    // Retrieve UserID and create a reference point in fire base
    var friends = []
    var appScope = this      // Can't use 'this.state' inside on() as the scope refers to the promise
    var userId = authentication.currentUser.uid
    var friendsRef = database.ref('userObjects/friends/' + userId + '/list')
    // Iterate through results and push to array
    friendsRef.on('value', function (snapshot) {
      console.log(snapshot.val())
      snapshot.forEach((child) => {
        friends.push({
          name: child.val().firstname + ' ' + child.val().lastname,
          username: child.val().username,
          birthday: child.val().birthday,
          highlight: false,
          key: child.key
        })
      })
      // Update state so ListView reflects the users friends
      // Note: Must occur inside on() as it is asynchronous and wont update properly outside
      appScope.setState({
        friendsDataSource: appScope.state.friendsDataSource.cloneWithRows(friends),
        friends: friends
      })
    }, function (errorObject) {
      console.log('The read failed: ' + errorObject.code)
    })
  }

  pressBack () {
    this.props.navigator.pop()
  }

  render () {
    return (
      <SendToFriends
        friends={this.state.friendsDataSource}
        onSelectFriend={this.selectFriend}
        renderSendUserRow={SendRow}
        seperatorFriends={seperatorFriends}
        selectedFriends={findSelectedFriends(this.state.friends)}
        onBackPress={this.pressBack}
        onSendPressed={this.send}
        isSending={this.state.isSending}
        hasSent={this.state.hasSent}
        sendError={this.state.sendError}
      />
    )
  }
}

function findSelectedFriends (friends) {
  if (friends != null) {
    return friends.map((e) => {
      if (e.highLighted) {
        return e
      }
    }).filter(n => n !== undefined)
  }
}

SendContainer.propTypes = {
  imageUri: PropTypes.string.isRequired
}

export default SendContainer
