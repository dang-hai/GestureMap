import React, { useState } from 'react';
import { Slider, Grid, Typography, makeStyles, IconButton, Button, Card } from '@material-ui/core';

import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import PauseCircleOutlineIcon from '@material-ui/icons/PauseCircleOutline';
import { useEffect } from 'react';
import { useRef } from 'react';

const useStyles = makeStyles({
    root: {
      width: "100%",
    },
  });

export default function AnimationSlider(props) {
    const classes = useStyles();
    const animationRef  = useRef(null);

    const { min, max, playAnimation, resetAnimation, disabled } = props;
    const [value, setValue] = useState(0);

    const [ onAnimationChanged ] = useState(() => props.onAnimationChanged)
    const [ onAnimationStart ] = useState(() => props.onAnimationStart)
    const [ onAnimationEnd ] = useState(() => props.onAnimationEnd)
    const [ handleClearAnimation ] = useState(() => props.handleClearAnimation)
    
    let minVal = min ? min : 0
    let maxVal = max ? max : 100

    const handleChange = (event, newValue) => {
      setValue(newValue);
    };

    useEffect(() => {
        if (playAnimation && value >= maxVal - 1) {
            setValue(0)
            onAnimationEnd();
        } else {
            onAnimationChanged({ change: value })
        }
    }, [playAnimation, value])

    useEffect(() => {
        // console.log('Handle Animation', animationRef.current, playAnimation, resetAnimation)

        if (resetAnimation) {
            setValue(0);
        }

        if (playAnimation && maxVal) {
            // Stop old animation
            clearInterval(animationRef.current);
            
            onAnimationStart();
            animationRef.current = setInterval(() => {
                setValue(prev => Math.min(maxVal - 1, prev + 1));
            }, [ 50 ])
            
        } else {
            clearInterval(animationRef.current);
            animationRef.current = null;
        }
        
    }, [animationRef, playAnimation, maxVal, resetAnimation])

    function handlePlayAnimationClick(evt) {
        console.log("handlePlayAnimationClick", playAnimation, value);

        if (!playAnimation && value >= maxVal - 1) {
            setValue(0)
        }

        if (playAnimation === false) {
            onAnimationStart()
        } else {
            onAnimationEnd()
        }
    }

    return (
        <Card className={classes.root}>
            <Grid container style={{width: "100%"}} alignItems="center" spacing={2}>
                <Grid item lg={2}>
                    <IconButton 
                        disabled={disabled}
                        onClick={handlePlayAnimationClick}>
                        {playAnimation ? <PauseCircleOutlineIcon/> : <PlayCircleOutlineIcon />}
                    </IconButton>
                </Grid>
                <Grid item lg={3} >
                    <Button 
                        disabled={disabled}
                        onClick={handleClearAnimation}>
                        Clear
                    </Button>
                </Grid>
                <Grid item lg={6}>
                    <Slider
                        disabled={disabled}
                        value={value} 
                        onChange={handleChange}
                        aria-labelledby="continuous-slider"
                        min={minVal}
                        max={maxVal}
                        step={1}
                        marks={true}
                        />
                </Grid>
                <Grid item lg={1}>
                    <Typography variant="overline">
                        {value}
                    </Typography>
                </Grid>
            </Grid>
        </Card>
    )
}

