# CollieWidget Readme

This Readme provides a comprehensive guide on how to use the CollieWidget JavaScript file.

## Introduction

CollieWidget is a powerful search widget that can be easily integrated into your website. It allows users to search for documents or resources across multiple categories and also displays suggested pages. The widget supports search history and keyboard shortcuts for easy navigation.

## Prerequisites

- A valid API key from MixPeek API service (https://mixpeek.com)
- An HTML element with a unique ID to bind the CollieWidget to
- Optional: A list of suggested pages to display in the widget

## Usage

To use CollieWidget, follow these steps:

1. Include the CollieWidget JavaScript and CSS files in your HTML file:

```html
// self host
<script src="colwid.js"></script>
// or use the CDN 
<script src="https://dbkcgeg8vo92c.cloudfront.net/colwid.js">
```

2. Include the CollieWidget JavaScript and CSS files in your HTML file:

```html
// self host
<script src="colwid.css"></script>
// or use the CDN 
<link href="https://dbkcgeg8vo92c.cloudfront.net/colwid.css">
```

3. Create an HTML element with a unique ID where the CollieWidget will be bound:

```html
<div id="collie-widget"></div>
```

4. Initialize the widget

```javascript
// init the collie search widget with your API key and div ID

new CollieWidget({
  api_key: "API_KEY",
  div_id: "search-widget",
  context: true, //optional
  suggested_pages: [
    {
      title: "Homepage",
      url: "https://collie.ai",
    }
  ]
});
```

[Live Demo](http://collie.ai/tesla)

![Alt Text](assets/demo.gif)



