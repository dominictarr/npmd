# Startup configuration scripts

This directory provides configuration files and scripts which you can use to run npmd as a service on various operating systems.

Just setup the base files in the appropriate places and adjust to your needs.

## Mac OSX

* Copy the org.node.npmd.plist file to ~/Library/LaunchAgents/ (or /Library/LaunchAgents if you wish to run it as the system administrator).
* Load the service with `launchctl load ~/Library/LaunchAgents/org.node.npmd.plist` (see [this blog post](http://nathangrigg.net/2012/07/schedule-jobs-using-launchd/) or [man 5 launchd.plist](https://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man5/launchd.plist.5.html) for more information).
* plist files require the full paths for everything, so if you adjust the example paths make sure you use absolute paths for your node and npmd binaries.
