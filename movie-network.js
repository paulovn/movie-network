/* ---------------------------------------------------------------------------
   (c) Telefónica I+D, 2013
   Author: Paulo Villegas
   This script is FREE SOFTWARE, it can be freely copied GPL v.2
   -------------------------------------------------------------------------- */

// Some constants
var WIDTH = 960,
    HEIGHT = 600,
    SHOW_THRESHOLD = 2.0;

// Graph behaviour variables
var activeMovie = undefined;
var offsetValue = { x : 0, y : 0 };
var zoomValue = 1.0;

// The D3.js scales
var xScale = d3.scale.linear()
  .domain([0, WIDTH])
  .range([0, WIDTH]);
var yScale = d3.scale.linear()
  .domain([0, HEIGHT])
  .range([0, HEIGHT]);

// The D3.js force-directed layout
var force = d3.layout.force()
  .charge(-320)
  .size( [WIDTH, HEIGHT] )
  .linkStrength( function(d,idx) { return d.weight; } );

// Add to the page the SVG element that will contain the movie network
var svg = d3.select("#movieNetwork").append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT)
  .attr("id","graph")
  .attr("viewBox", "0 0 " + WIDTH + " " + HEIGHT )
  .attr("preserveAspectRatio", "xMidYMid meet")


/*function redraw() {
  console.log("here", d3.event.translate, d3.event.scale);
  svg.attr("transform",
      "translate(" + d3.event.translate + ")"
      + " scale(" + d3.event.scale + ")");
}*/


/* Change status of a panel from visible to hidden or viceversa
   id: identifier of the div to change
   status: 'on' or 'off'. If not specified, the panel will toggle status
*/
function toggleDiv( id, status ) {
  d = d3.select('div#'+id);
  console.log( 'TOGGLE', id, d.attr('class'), '->', status );
  if( status === undefined )
    status = d.attr('class') == 'panel_on' ? 'off' : 'on';
  d.attr( 'class', 'panel_' + status );
  return false;
}


// Movie panel: the div into which the movie details info will be written
movieInfoDiv = d3.select("#movieInfo");

// The function to be called to change the movie highlighted in the graph
// (it is a closure within the d3.json() call)
var selectMovie;

/* Clear all help boxes and select a movie in the network and in the 
   movie details panel
*/
function clearAndSelect(id) {
  toggleDiv('faq','off'); 
  toggleDiv('help','off'); 
  selectMovie(id,true);
}


/* Compose the content for the panel with movie details.
   Parameters: the node data, and the array containing all nodes
   */
function getMovieInfo( n, nodeArray ) {
  console.log( "INFO", n );
  info = '<img src="img/close.png" style="float:left; cursor: pointer;" onClick="toggleDiv(\'movieInfo\');"/>';

  if( n.cover )
    info += '<img height="300" src="' + n.cover + '" title="' + n.label + '"/>';
  else
    info += "<div class=t>" + n.title + '</div>';
  if( n.genre )
    info += '<div><span class=l>Genre</span>: <span class=g>' 
         + n.genre + '</span></div>';
  if( n.director )
    info += '<div><span class=l>Directed by</span>: <span class=d>' 
         + n.director + '</span></div>';
  if( n.cast )
    info += '<div><span class=l>Cast</span>: <span class=c>' 
         + n.cast + '</span></div>';
  if( n.duration )
    info += '<div><span class=l>Year</span>: ' + n.year 
         + ' <span class=l>Duration</span>: ' + n.duration + '</div>';
  if( n.links ) {
    info += '<div><span class=l>Related to</span>: ';
    n.links.forEach( function(idx) {
      info += '[<a href="javascript:void(0);" onclick="selectMovie('  
	   + idx + ',true);">' + nodeArray[idx].label + '</a>]'
    });
    info += '</div>';
  }
  return info;
}


// ****************************************************************************

d3.json('movie-network-25-7-3.json',

	function(data) {

          //console.log(data);

	  // Declare the variables pointing to the node & link arrays
          var nodeArray = data.nodes;
          var linkArray = data.links;
          console.log("NODES:",nodeArray);
          console.log("LINKS:",linkArray);

	  // Add an id field to each node (just in case the index changes later)
	  /*node_id = 0;
	  nodeArray.forEach( function(node) {
	    node.id = node_id++;
	  });*/

/*
	  // add a list of targets as an attribute to each node
	  function add_target( source_idx, target_idx ) {
	    //if( typeof nodeArray[source].targets === 'undefined' )
	    nodeArray[source_idx].targets = nodeArray[source_idx].targets || {};
	    nodeArray[source_idx].targets[ nodeArray[target_idx].id ] = true;
	  }

	  // Add to each node the list of nodes linked to it
	  linkArray.forEach( function(link) {
	    add_target( link.source, link.target );
	    add_target( link.target, link.source );
	  });
*/

	  /* Modify a node highlight in the network.
	     Parameters are: 
	       - node: data for the node to be changed,  
	       - on: true/false to show/hide the node
	       - dom_circle: a pointer to the DOM node for the circle 
	         representing the node
	  */
	  function showNode( node, on, dom_circle )
	  {
	    console.log("SHOW NODE ["+node.label + "]: " + on);
	    console.log(" ..object ["+node + "]: " + on);
	    // locate the dom_node
	    if( dom_circle === undefined ) {
	      group = d3.select( '#n' + node.index );
	      box = group.select( 'div' );
	      circle = group.select( 'circle' );
	    }
	    else {
	      circle = d3.select(dom_circle);
	      box = d3.select(dom_circle.parentNode).select("div");
	    }
	    console.log(" ..DOM: ",box);

	    // If we are to activate a movie, and there's already one active
	    // first switch that off
	    if( on && activeMovie !== undefined )
	      showNode( nodeArray[activeMovie], false );

	    // activate/deactivate the node itself
	    console.log( " ..box CLASS BEFORE:", box.attr("class") );
	    console.log( " ..circle CLASS BEFORE:", circle.attr("class") );
	    //d3.select(dom_node.parentNode).select("div")
	    circle
	      .classed( on ? 'on' : 'node' );	      
	    box
	      .attr("class", on ? "on main" : 
		             zoomValue >= SHOW_THRESHOLD ? "zoomed" : "off" );
	    console.log( " ..circle CLASS AFTER:", circle.attr("class") );
	    console.log( " ..box CLASS AFTER:", box.attr("class") );
	    console.log( " " ,box );
	    // activate all siblings
	    console.log(" ..SIBLINGS:"+node.links);
	    //Object.keys(d3_node.out).forEach( function(id) {
	    Object(node.links).forEach( function(id) {
	      console.log("\t#t"+id);
	      d3.select("#t"+id).attr("class", on ? "on sibling" : 
				       zoomValue>SHOW_THRESHOLD ? "zoomed" : "off" );
	    } );

	    // set the value for the current active movie
	    activeMovie = on ? node.index : undefined;
	  }


	  /* Show the panel for the passed movie AND highlight its node in 
	     the graph
	  */
	  selectMovie = function( new_idx, doMoveTo ) {
	    //console.log( "FIND:", d3.select('#c'+nodeArray[new_idx].index) );
	    // we need to pass the DOM node here, not a d3 selection
	    //circle = document.getElementById( 'c' + nodeArray[new_idx].index );
	    console.log("SELECT", new_idx, doMoveTo );
	    doMoveTo = doMoveTo || false;
	    if( doMoveTo ) {
	      console.log("..POS: ", offsetValue.x, offsetValue.y, '->', nodeArray[new_idx].x, nodeArray[new_idx].y );
	      offset = { x : (WIDTH/2  - nodeArray[new_idx].x)/zoomValue,
			 y : (HEIGHT/2 - nodeArray[new_idx].y)/zoomValue }
	      repositionGraph( offset, zoomValue, true );
	    }
	    showNode( nodeArray[new_idx], true );
	    showMoviePanel( nodeArray[new_idx] );
	  }


	  function showMoviePanel( node ) {
	    // Fill it and display the panel
	    movieInfoDiv
	      .html( getMovieInfo(node,nodeArray) )
	      .attr("class","panel_on");
	  }

	    
          //console.log( nodeArray.map( function(n) {return n.weight;} ) );

	  /*max_weight = Math.max.apply( null,
                                       nodeArray.map( function(n) {return n.weight;} ) );
	  console.log( max_weight );
	  */

	  // Scales for node radius & edge width
	  var node_size = d3.scale.linear()
	    .domain([0,6])
	    .range([3,10])
	    .clamp(true);
	  var edge_width = d3.scale.linear()
	    .domain([0,20])
	    .range([1,10])
	    .clamp(true);


	  // Create the force-directed layout
          force
	    .nodes(nodeArray)
	    .links(linkArray)
	    .start();

          // Create the elements of the layout (links and nodes)
          var link = svg.selectAll(".link")
	    .data(linkArray,function(d){return d.source.id+'-'+d.target.id;})
	    .enter().append("line")
	    .style('stroke-width', function(d) { return edge_width(d.weight);} )
	    .attr("class", "link");

	  // A node is represented as an SVG group containing a circle and 
	  // an HTML DIV node for the title
          var node_group = svg.selectAll(".node")
	    .data( nodeArray, function(d){return d.label} )
	    .enter().append("g")
	    .attr('id', function(d) { return "n" + d.index; } );


/*	  bb = node_group.append("rect")
	    .attr('x',0)
	    .attr('y',0)
	    .attr('height', 20 )
	    .attr('width', 20 )
	    .attr('style','stroke:#ff0000')
*/
          /*node_group
	    .attr('id', function(d) { return "n" + d.id; } );*/

	  circles = node_group.append("circle")
	    .attr('id', function(d) { return "c" + d.index; } )
            .attr('class', function(d) { return 'node level'+d.level;} )
            .attr('r', function(d) { return node_size(d.weight); } )
	    .attr('pointer-events', 'all')
	    .on("click", function(d) { showMoviePanel(d); } )
	    .on("mouseover", function(d) { showNode(d,true,this);  } )
	    .on("mouseout",  function(d) { showNode(d,false,this); } );

/*	  titles = node_group.append("text")
	    .attr('id', function(d) { return "t" + d.id; } )
	    .attr('pointer-events', 'none') // so that they go to the circle beneath
	    .attr('class',"shadow")
	    .text( function(d) { return d.label; } );*/

	  titles = node_group.append('foreignObject')
	    .attr('x','-4em')
	    .attr('y','-1em')
	    .attr('width','8em')
	    .attr('height','3em')
	    .attr('pointer-events', 'none')
	    .append("xhtml:div")
	    .attr('id', function(d) { return "t" + d.index; } )
	    .attr('pointer-events', 'none') // so that they go to the circle beneath
	    .attr('class',"off")
	    .text( function(d) { return d.label; } );

	  /*var txtWidth = textContnt.getBBox().width;
	  var txtHeight = textContnt.getBBox().height;
	  var actualTextY =  y + ( txtHeight/2) ;
	  canvas.change(rect,{"width":txtWidth,"height":txtHeight});
	  canvas.change(textContnt,{"y":actualTextY});*/

          /*circles.append("title")
            .text(function(d) { return d.name; });*/


	  /* Add drag & zoom behaviours */
	  svg.call( d3.behavior.drag()
		    .on("drag",dragmove) );
	  svg.call( d3.behavior.zoom()
		    .x(xScale)
		    .y(yScale)
		    .scaleExtent([1, 6])
		    .on("zoom", doZoom) );

	    //.call(d3.behavior.zoom().on("zoom", redraw))

	  // Perform drag
	  function dragmove(d) {
	    //console.log("DRAG", JSON.stringify(d3.event) );
	    console.log("DRAG", d3.event );
	    offset = { x : offsetValue.x + d3.event.dx,
		       y : offsetValue.y + d3.event.dy };
	    repositionGraph( offset, zoomValue );
	  }


	  /* Perform zoom. We do "semantic zoom", not geometric zoom
	   * (nodes do not change size, but get spread out or streched
	   * together as zoom changes)
	   */
	  function doZoom() {
	    console.log("ZOOM",zoomValue,"->",d3.event.scale,d3.event.translate);
	    if( zoomValue == d3.event.scale )
	      return;	// no zoom change

	    // See if we cross the 'show' threshold in either direction
	    if( zoomValue<SHOW_THRESHOLD && d3.event.scale>=SHOW_THRESHOLD )
	      svg.selectAll("div.off").attr("class","zoomed")
	    else if( zoomValue>=SHOW_THRESHOLD && d3.event.scale<SHOW_THRESHOLD )
	      svg.selectAll("div.zoomed").attr("class","off")

	    // Store the current zoom & reposition the graph
	    zoomValue = d3.event.scale;
	    repositionGraph( {x:0, y:0}, zoomValue );

	    //node_group.attr("transform", transform);
	    //link.attr("transform", transform);
	  }


	  /* Move all graph elements to its new positions. Triggered
	     - on translations (user panning)
	     - on zoom changes
	     - on node repositioning (as result of a force-directed iteration)
	  */
	  function repositionGraph( off, z, transition ) {
	    var doTr = (typeof transition === "undefined") ? false : transition;
	    if( off !== undefined ) {
	      offsetValue.x = off.x;
	      offsetValue.y = off.y;
	    }
	    // move edges
	    l = doTr ? link.transition().duration(500) : link;
            l
	      .attr("x1", function(d) { return z*(d.source.x+offsetValue.x); })
              .attr("y1", function(d) { return z*(d.source.y+offsetValue.y); })
              .attr("x2", function(d) { return z*(d.target.x+offsetValue.x); })
              .attr("y2", function(d) { return z*(d.target.y+offsetValue.y); });
	    // move nodes
	    n = doTr ? node_group.transition().duration(500) : node_group;
            n
	      .attr("transform", function(d) { return "translate("
					       +z*(d.x+offsetValue.x)+","
					       +z*(d.y+offsetValue.y)+")" } );
	  }
           

	  // unused??
	  function transform(d) {
	    console.log( "TRANSFORM", d3.event.scale, d3.event.translate[0], d3.event.translate[1]);
	    scale = d3.event.scale
	    position = d3.event.translate
	    console.log( "TRF " + d )
	    offsetValue.x = xScale(position[0])
	    offsetValue.y = yScale(position[1])	    
	    return "translate(" + xScale(offsetValue.x) + "," + yScale(offsetValue.y) + ")";
	  }


	  /* events for the force-directed graph */
          force.on("tick", function() {
	    repositionGraph(undefined,zoomValue);
/*
            link
	      .attr("x1", function(d) { return d.source.x + offsetValue.x; })
              .attr("y1", function(d) { return d.source.y + offsetValue.y; })
              .attr("x2", function(d) { return d.target.x + offsetValue.x; })
              .attr("y2", function(d) { return d.target.y + offsetValue.y; });

            node_group
	      .attr("transform", 
		    function(d) { return "translate("
				  +(d.x+offsetValue.x)+","
				  +(d.y+offsetValue.y)+")" } );
*/
/*            circles
	      .attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; });

	    titles
	      .attr("x", function(d) { return d.x; })
              .attr("y", function(d) { return d.y; });
*/
          });

	  //console.log( circles );
          //force.start();

        });
        