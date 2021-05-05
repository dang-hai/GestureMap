import React, { useEffect, useState } from 'react';
import { useHistory } from "react-router-dom";

import { GridList, Card, GridListTile, CardHeader, CardContent, Typography,  CardActionArea } from '@material-ui/core';
import { BASE_URL } from './config';


function useConfigurations() {
    const [configurations, setConfgiurations ] = useState([]);

    useEffect(() => {
        fetch(`${BASE_URL}/api/config/list`)
        .then(res => res.json())
        .then(setConfgiurations)
        .catch(console.error)
    }, [])

    return configurations
}

export default function StartScreen(props) {
    const history = useHistory();

    const configurations = useConfigurations();

    function handleConfigurationSelected(config) {
        history.push(`/analyze/${config['name']}`)
    }

    return (
        <GridList cols={4} style={{marginTop: 8}}>
           {configurations.map((item, i) => (
               <GridListTile key={i} >
                   <Card elevation={5} style={{border: "2px solid black"}}>
                       <CardActionArea onClick={() => handleConfigurationSelected(item)}>
                            <CardHeader title={item.name}/>
                            <CardContent>
                                <Typography>{item.model}</Typography>
                                <Typography>{item.data}</Typography>
                            </CardContent>
                       </CardActionArea>
                   </Card>
               </GridListTile>
           ))}
           <GridListTile>
                   <Card elevation={5} style={{border: "3px dashed grey"}}>
                       <CardActionArea onClick={() => history.push("/new-configuration")}>
                            <CardHeader title="Add New Configuration"/>
                       </CardActionArea>
                   </Card>
               </GridListTile>
        </GridList>
    )
}