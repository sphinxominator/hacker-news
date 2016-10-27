var apiUrl = 'https://hacker-news.firebaseio.com/v0';
var storyIDs = [];
var stories = [];
var authorKarma = {};
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
      storyIDs = getRandom(ids, 10);
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
      response.map(function(author){
        authorKarma[author.id] = author.karma;
      });
    }
  }
};


// http://stackoverflow.com/questions/19269545/how-to-get-n-no-elements-randomly-from-an-array
function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len;
    }
    return result;
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

  stories.sort(function(a,b){
    if(a.score > b.score) return 1;
    if(a.score < b.score) return -1;
    if(a.score == b.score) return 0;
  })
  .map(function(story, i){
    (function(i){
      setTimeout(function(){
        list.appendChild(article(story));
      },70*i);
    })(i);
  });
}

function error(error) {
  spinner.style.display = 'none';
  fetching = false;
  throw new Error(error);
}

// Components
function article(story) {
  var card = document.createElement('div');
  card.classList.add('article');
  card.appendChild(header(story.title, story.score));
  card.appendChild(link(story.url));
  card.appendChild(info(story.by, story.time));
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

function info(id, time) {
  var author = document.createElement('p');
  var string = 'Posted ' + timestampString(time) + ' by ' + id + ' (+' + authorKarma[id]+')';
  author.appendChild(document.createTextNode(string));
  return author;
}

function timestampString(time) {
  var timestamp = document.createElement('p');
  var d = new Date(time*1000);
  return d.getDate()+ "-" + (d.getMonth()+1) + "-" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes();
}
