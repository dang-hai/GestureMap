import React, { Fragment, useRef, useEffect } from 'react';
import TimelineIcon from '@material-ui/icons/Timeline';
import { Fab, makeStyles } from '@material-ui/core';
import Plotly from 'plotly.js-dist';

useStyles = makeStyles({
    root: {
        width: "100%",
        height: "100%"
    }
})

export default function CustomCanvas(props) {
    const { xAxis, yAxis } = props;
    const ref = useRef(null);

    const classes = useStyles();
    const [ drawingMode, setDrawingMode ] = useState(false);

    useEffect(() => {
        Plotly.newPlot(ref.current, [], {}, {})
        ref.current.on('click', handleClick)
        ref.current.on('dblclick', onDrawingEnd)
    }, [])

    function handleClick() {
        const [x, y] = d3.mouse(this);
        console.log(x,y)
    }

    function onDrawingEnd() {

    }

    return (
        <Fragment>
            <div className={classes.root} ref={ref}/>
            <Fab>
                <TimelineIcon/>
            </Fab>
        </Fragment>
    )
}