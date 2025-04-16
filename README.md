# CinemAtlas 
CinemAtlas is a modern, interactive web platform designed for users to explore film availability across the globe. By integrating data from The Movie Database (TMDb) API, the platform presents an interactive world map that highlights countries where a selected movie or a director’s films are available across various streaming and transactional services.
# Overview
CinemAtlas combines a unified search interface with advanced filtering tools to deliver a seamless user experience on both desktop and mobile devices. Users can search either by movie title or by director name using the single search bar with a simple dropdown selector. The platform then displays suggestions in real time using TMDb’s API.

Once the user makes a selection, CinemAtlas queries additional watch provider data to determine where the movie – or the selected director’s films – is available to stream, rent, or buy. An interactive map is updated with “active” countries highlighted in green. Users can navigate between the highlighted countries using Prev/Next buttons or directly by clicking on flag icons displayed in the World View section.
# Key Features
# Unified Search Interface
A single search bar allows users to switch between movie and director searches via a dropdown selector. When typing, suggestions are displayed in a fluid, auto-suggest list.
# Interactive Map
An interactive, zoomable world map (powered by D3.js) visually represents the availability of films across different countries. Countries where the selected content is available are highlighted in green. Clicking on a country displays detailed watch provider options.
# Advanced Filtering System
Users can refine their search results by selecting specific streaming services. The filter panel includes a set of “chip” style buttons with service logos (including Netflix, Prime, Disney+, Apple TV, MUBI, and Paramount+). An “Only Streaming” option is also available to filter for platforms offering subscription-based streaming. The filters update the map dynamically, whether the search was performed by movie or by director.
# World View
The World View feature aggregates the availability data across all countries into a compact, visually appealing interface.
In the case of a single movie, the view displays a series of clickable flag icons representing the countries where the film is available.
When a director is selected, the platform shows a list of films along with corresponding flag icons of the countries where each film is available. Clicking a flag navigates the user to that country’s detailed availability information.
# Responsive, Fullscreen Video Intro
The platform features a fullscreen introductory video (played in a muted, autoplay loop) to enhance the user experience. The video’s design employs an object-fit approach for a smooth, fullscreen display on both desktop and mobile devices.


# Getting Started 
# 1.Installation
Clone the repository and open the index.html file in your browser. Ensure that the file structure includes the necessary directories such as js/, css/, data/ (which includes world.geojson), and video/.
# 2. TMDb API Key
Update the TMDB_API_KEY variable in js/main.js with your own API key from TMDb.
# 3. Deployment
Host the platform on a web server. For optimal performance, make sure to serve the static files with cache busting (using versioning query strings) to avoid issues with outdated assets on mobile devices.
