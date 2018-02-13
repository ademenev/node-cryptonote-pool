import Vue from 'vue'
import routes from './routes'
import store from 'store';
import socket from 'socket';

const app = new Vue({
  el: '#app',
  data: store.state,
  computed: {
    ViewComponent () {
      const matchingView = routes.find(r => this.currentRoute == r.path) || routes[0];
      return matchingView.component;
    }
  },
  render (h) {
    return h(this.ViewComponent)
  }
})

window.addEventListener('hashchange', () => {
  app.currentRoute = (window.location.hash || "").replace('#', '');
});