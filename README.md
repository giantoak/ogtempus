OG Tempus is a minimal, prototype system for doing easy analyses of Time Series data. 

## Quickstart (server)
1. If you don't have [tangelo](https://github.com/Kitware/tangelo) installed, get it! `pip install tangelo` or `conda install tangelo`
1. Run `tangelo --port 8080` to start the server.
1. Take the necessary steps to expose the server to the public, just leave it local, or use a program like [ngrok](https://ngrok.com/) 
to temporarily expose the server to the public.


## Quickstart (client)
1. Use a browser to connect to port 8080 of the server where OGT is being hosted
1. Drag a CSV file that has unique dates in column 1 and values for those dates in column 2 into the left-hand pane. 
(You may need to click the hamburger icon to reveal the pane.)
1. Select an analysis from the drop-down menu in the left-hand pane.
1. Repeat as needed.



