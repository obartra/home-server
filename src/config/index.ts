const title = 'CHOVE';
const repository = 'https://github.com/obartra/object-detection';

const messages = {
  loader: {
    fail: 'Things went a little 💥',
  },
  images: {
    failed: 'Failed to retrieve images',
  },
  404: 'Oops you typed something wrong! 😱',
};

const dateFormat = 'MMMM DD, YYYY';

const loader = {
  // no more blinking in your app
  delay: 300, // if your asynchronous process is finished during 300 milliseconds you will not see the loader at all
  minimumLoading: 700, // but if it appears, it will stay for at least 700 milliseconds
};

const defaultMetaTags = {
  image: '/pwa-512x512.png',
  description: 'CHOVE Home App',
};

export { loader, dateFormat, messages, repository, title, defaultMetaTags };
