/**
 * Build styles
 */
require('./index.css').toString();

/**
 * SimpleImage Tool for the Editor.js
 * Works only with pasted image URLs and requires no server-side uploader.
 *
 * @typedef {object} SimpleImageData
 * @description Tool's input and output data format
 * @property {string} url — image URL
 */
class SimpleImage {
  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {{data: SimpleImageData, config: object, api: object}}
   *   data — previously saved data
   *   config - user config for Tool
   *   api - Editor.js API
   */
  constructor({data, config, api}) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.api = api;
    this.config = config;
    this.data = data;

    /**
     * When block is only constructing,
     * current block points to previous block.
     * So real block index will be +1 after rendering
     * @todo place it at the `rendered` event hook to get real block index without +1;
     * @type {number}
     */
    this.blockIndex = this.api.blocks.getCurrentBlockIndex() + 1;
  }

  /**
   * Creates a Block:
   *  1) Show preloader
   *  2) Start to load an image
   *  3) After loading, append image and caption input
   * @public
   */
  render() {
    let image;
    let imagePromise;

    if (this.data.url) {
      image = document.createElement('img');
      image.src = this.data.url;

      imagePromise = new Promise((resolve, reject) => {
        image.onload = () => {
          this._data.naturalWidth = image.naturalWidth;
          this._data.naturalHeight = image.naturalHeight;
          resolve(image);
        };
    
        image.onerror = reject;
      })
    }

    return this.config.view({
      pluginId: this.id,
      pluginApi: this.api,
      pluginData: this.data,
      pluginUserConfig: this.config,
      pluginImage: image,
      pluginImagePromise: imagePromise,
    });
  }

  /**
   * @public
   * Saving method
   * @param {Element} blockContent - Tool's wrapper
   * @return {SimpleImageData}
   */
  save(blockContent) {
    let image = blockContent.querySelector('img');

    if (!image) {
      return this.data;
    }

    return Object.assign(this.data, {
      url: image.src,
    });
  }

  /**
   * Sanitizer rules
   */
  static get sanitize() {
    return {
      url: {},
    };
  }

  /**
   * Read pasted image and convert it to base64
   *
   * @static
   * @param {File} file
   * @returns {Promise<SimpleImageData>}
   */
  onDropHandler(file) {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    return new Promise(resolve => {
      reader.onload = (event) => {
        resolve({
          url: event.target.result,
        });
      };
    });
  }

  /**
   * On paste callback that is fired from Editor.
   *
   * @param {PasteEvent} event - event with pasted config
   */
  onPaste(event) {
    switch (event.type) {
      case 'tag':
        const img = event.detail.data;

        this.data = {
          url: img.src,
        };
        break;

      case 'pattern':
        const {data: text} = event.detail;

        this.data = {
          url: text,
        };
        break;

      case 'file':
        const {file} = event.detail;

        this.onDropHandler(file)
          .then(data => {
            this.data = data;
          });

        break;
    }
  }

  /**
   * Returns image data
   * @return {SimpleImageData}
   */
  get data() {
    return this._data;
  }

  /**
   * Set image data and update the view
   *
   * @param {SimpleImageData} data
   */
  set data(data) {
    this._data = Object.assign({}, this.data, data);

    if (this.data.url) {
      this.render()
    }
  }

  /**
   * Specify paste substitutes
   * @see {@link ../../../docs/tools.md#paste-handling}
   * @public
   */
  static get pasteConfig() {
    return {
      patterns: {
        image: /https?:\/\/\S+\.(gif|jpe?g|tiff|png)(\?[^?]+|$)/i
      },
      tags: [ 'img' ],
      files: {
        mimeTypes: [ 'image/*' ]
      },
    };
  }
}

module.exports = SimpleImage;
