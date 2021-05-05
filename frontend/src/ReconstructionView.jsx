import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist';
import { useMemo } from 'react';



const hip_center = 0,
    spine = 1,
    shoulder_center = 2,
    head = 3,
    shoulder_left = 4,
    elbow_left = 5,
    wrist_left = 6,
    hand_left = 7,
    shoulder_right = 8,
    elbow_right = 9,
    wrist_right = 10,
    hand_right = 11,
    hip_left = 12,
    knee_left = 13,
    ankle_left = 14,
    foot_left = 15,
    hip_right = 16,
    knee_right = 17,
    ankle_right = 18,
    foot_right = 19

function push_coord(arr, raw_data) {
    let coord = { 
        x: [],
        y: [],
        z: [],
        type: 'scatter3d',
        mode: 'lines+markers',
        marker: {
            size: 3,
            opacity: 1
        },
        line: {
            width: 2,
        }
    }

    for (let i = 0; i < arr.length; i++) {
        let skeleton_coord = arr[i];
        coord.x.push(raw_data.x[skeleton_coord])
        coord.y.push(-raw_data.z[skeleton_coord])
        coord.z.push(raw_data.y[skeleton_coord])
    }

    return coord
}

function build_skeleton_frame(raw_data) {
    return [
        push_coord([shoulder_center, shoulder_left, elbow_left, wrist_left, hand_left], raw_data),
        push_coord([shoulder_center, shoulder_right, elbow_right, wrist_right, hand_right], raw_data),
        push_coord([shoulder_center, shoulder_right, elbow_right, wrist_right, hand_right], raw_data),
        push_coord([hip_center, hip_left, knee_left, ankle_left, foot_left], raw_data),
        push_coord([hip_center, hip_right, knee_right, ankle_right, foot_right], raw_data),
        push_coord([head, shoulder_center, spine, hip_center], raw_data),
    ]
}

export default function ReconstructionView(props) {
    const skeletonViewRef = useRef(null);

    const {
        animationData,
        playAnimation,
        animationProgress,
        reconstructedSkeleton
    } = props;


    const layout = {
        scene: {
            xaxis: {
                range: [-1, 1],
            },
            zaxis: {
                range: [-1, 1],
            },
            yaxis: {
                range: [-1, 1],
            },
            aspectmode: 'cube',
        },
        margin: {
            t: 0, b: 0, l: 0, r: 0, padding: 0
        },
        paper_bgcolor: '#00000000',
        plot_bgcolor: '#00000000',
        showlegend: false,
        legend: {
            y: 0,
            x: 0,
        },
        
    }

    useEffect(() => {
        if (reconstructedSkeleton.data !== undefined) {
            let rec = reconstructedSkeleton.data.map(build_skeleton_frame);
            Plotly.react(skeletonViewRef.current, rec[0], layout)
        }
    }, [props.reconstructedSkeleton])

    useEffect(() => {
        if (animationData !== undefined  && animationData !== null
            && animationProgress !== undefined
            && animationProgress < animationData.data.length
            ) {
            
            let frames = build_skeleton_frame(animationData.data[animationProgress])
            
            Plotly.react(skeletonViewRef.current, frames, layout);
        } else {
            console.log("Can't animate", animationData, playAnimation, animationProgress)
        }

    }, [ animationData, playAnimation, animationProgress ])

    return <div ref={skeletonViewRef} style={props.style}></div>
}