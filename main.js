var apiUrl = 'https://hacker-news.firebaseio.com/v0';
var storyIDs = [];
var stories = [];
var authors = [];
var spinner = document.getElementById('spinner');
var fetching = false;

function makeRequest(path) {
  var promise = new Promise(function(resolve, reject) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.open("GET", apiUrl + path);
    httpRequest.send();

    httpRequest.onload = function() {
      if(this.status == "200"){
        resolve(JSON.parse(this.response));
      }
      else {
        reject(this.statusText);
      }
    }

    httpRequest.onerror = function() {
      reject(this.statusText);
    }
  });

  return promise;
}

var requests = {
  ids: {
    request: function() {
      return makeRequest('/topstories.json').then(
        requests.ids.success
      );
    },
    success: function(ids) {
      storyIDs = ids.slice(0,10);
    }
  },
  stories: {
    request: function() {
      var promises = storyIDs.map(function(id){
        return makeRequest('/item/' + id + '.json');
      });

      return Promise.all(promises).then(requests.stories.success);
    },
    success: function(response){
      stories = response;
    }
  },
  authors: {
    request: function() {
      var promises = stories.map(function(story){
        return makeRequest('/user/' + story.by + '.json');
      });

      return Promise.all(promises).then(requests.authors.success);
    },
    success: function(response) {
      authors = response;
    }
  }
};


// Components
function article(story, user) {
  var card = document.createElement('div');
  card.classList.add('article');
  card.appendChild(header(story.title, story.score));
  card.appendChild(link(story.url));
  card.appendChild(timestamp(story.time));
  card.appendChild(author(user.id, user.karma));
  return card;
}

function header(title, score) {
  var header = document.createElement('h2');
  header.appendChild(document.createTextNode(title + ' +' + score));
  return header;
}

function link(url) {
  var link = document.createElement('a');
  var container = document.createElement('span');
  link.setAttribute('href', url);
  link.appendChild(container);
  return link;
}

function timestamp(time) {
  var timestamp = document.createElement('p');
  var string = new Date(time).toString();
  timestamp.appendChild(document.createTextNode(string));
  return timestamp;
}

function author(id, karma) {
  var author = document.createElement('p');
  author.appendChild(document.createTextNode('by ' + id + ' - ' + karma));
  return author;
}

function start() {
  if(fetching) return;
  fetching = true;
  spinner.classList.add('loading');
  spinner.style.fontSize= 0;
  requests.ids.request()
  .then(requests.stories.request)
  .then(requests.authors.request)
  .then(success)
  .catch(error);
}

function success(){
  spinner.style.display = 'none';
  fetching = false;
  var list = document.getElementById('article-list');
  console.log(stories,authors);

  stories.sort(function(a,b){
    if(a.score > b.score) return 1;
    if(a.score < b.score) return -1;
    if(a.score == b.score) return 0;
  })
  .map(function(story, i){
    (function(i){
      setTimeout(function(){
        list.appendChild(article(story,{id:'sphinxo',karma:7881}));
      },70*i);
    })(i);
  });
}

function error(error) {
  spinner.style.display = 'none';
  fetching = false;
  throw new Error(error);
}
