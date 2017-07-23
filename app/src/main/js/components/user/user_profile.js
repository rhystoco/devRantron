import React, { Component } from 'react';
import PropTypes from 'prop-types';
import rantscript from '../../consts/rantscript';
import Loading from '../utilities/loading';
import Column from '../columns/column';
import { ITEM, STATE } from '../../consts/types';

const USER_PROFILE_FILTERS = {
  SORT: {
    RANTS: 'rants',
    COMMENTS: 'comments',
    FAVOURITES: 'favorites',
    UPVOTED: 'upvoted',
  },
  PRIMARY: 'SORT',
};

const DEFAULT_COLUMN = {
  itemType: ITEM.RANT.NAME,
  items: [],
  page: 0,
  id: 'id',
  type: 'user_profile',
  state: STATE.SUCCESS,
  filters: USER_PROFILE_FILTERS,
  sort: USER_PROFILE_FILTERS.RANTS,
};

class UserProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      column: DEFAULT_COLUMN,
    };
  }
  componentDidMount() {
    this.fetch();
  }
  componentWillUnmount() {
    console.log('unmounting user Profile');
  }
  fetch(sort = USER_PROFILE_FILTERS.SORT.RANTS, range = null, id = 0, refresh = false) {
    const { item, auth } = this.props;
    const prevColumn = Object.assign({}, this.state.column);
    prevColumn.state = STATE.LOADING;
    if (sort !== this.state.column.sort) {
      prevColumn.page = 0;
      prevColumn.items = [];
    }
    this.setState({ column: prevColumn });


    const { column } = this.state;
    const page = refresh || sort !== this.state.column.sort ? 0 : column.page;
    let token = null;
    if (auth.user) {
      token = auth.user.authToken;
    }
    rantscript.profile(item.id, token, sort, page * 30)
      .then((res) => {
        /**
         * If you clone the object, JS keeps directly modifies the the items of DEFAULT_COLUMN.
         * Which stays even after the component unmounts. So next time the component is mounting
         * it is showing the previous items.
         *
         * Bloody hell, JS. You're beautiful
         */
        const nextColumn = Object.assign({}, DEFAULT_COLUMN);
        nextColumn.page = this.state.column.page + 1;
        const nextItems = sort !== column.sort ? [] : [...column.items];
        nextColumn.items = [...nextItems, ...res.content.content[sort]];
        nextColumn.state = STATE.SUCCESS;
        nextColumn.sort = sort;
        if (sort === USER_PROFILE_FILTERS.SORT.COMMENTS) {
          nextColumn.itemType = ITEM.COMMENT.NAME;
        } else {
          nextColumn.itemType = ITEM.RANT.NAME;
        }
        this.setState({
          user: res,
          column: nextColumn,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
  render() {
    if (!this.state.user) {
      return (
        <div className="modal">
          <Loading />
        </div>
      );
    }
    const { user } = this.state;
    let imageSource = 'res/images/invis.png';
    if (user.avatar.i) {
      imageSource = `https://avatars.devrant.io/${user.avatar.i.replace('c-1', 'c-3').replace('png', 'jpg')}`;
    }
    return (
      <div className="profile_container modal" >
        <div className="profile">
          <div className="image">
            <img alt="" src={imageSource} style={{ backgroundColor: `#${user.avatar.b}` }} />
          </div>
          <div className="details">
            <div className="name_score">
              <span className="name">{user.username}</span>
              <span className="score">+{user.score}</span>
            </div>
            <div className="other_infos">
              <ul>
                { user.about !== '' && <li><i className="ion-person" /><p>{user.about}</p></li>}
                { user.location !== '' && <li><i className="ion-ios-location" /><p>{user.location}</p></li>}
                { user.github !== '' && <li><i className="ion-social-github" /><p>{user.github}</p></li>}
                { user.website !== '' && <li><i className="ion-earth" /><p>{user.website}</p></li>}
              </ul>
            </div>
          </div>
        </div>
        <div className="user_contents">
          <Column
            {...this.props}
            column={this.state.column}
            filters={this.state.column.filters}
            itemType={this.state.column.itemType}
            fetch={(sort, range, id, refresh) => this.fetch(sort, range, id, refresh)}
          />
        </div>
      </div>
    );
  }
}

UserProfile.propTypes = {
  item: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
};

export default UserProfile;
