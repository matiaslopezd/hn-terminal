export const BASE_URL = 'https://hacker-news.firebaseio.com/v0';
export const userCache = new Map();

export const api = {
  getStories: async (type) => {
    return fetch(`${BASE_URL}/${type}stories.json`).then(res => res.json());
  },
  getItem: async (id) => {
    return fetch(`${BASE_URL}/item/${id}.json`).then(res => res.json());
  },
  getUser: async (id) => {
    if (userCache.has(id)) return userCache.get(id);
    const promise = fetch(`${BASE_URL}/user/${id}.json`).then(res => res.json()).catch(err => { userCache.delete(id); throw err; });
    userCache.set(id, promise);
    return promise;
  }
};