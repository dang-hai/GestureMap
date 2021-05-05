import { useEffect, useState, useRef } from 'react';
import { BASE_URL } from './config';

export function useInitConfig(configID) {
    const [ loaded, setLoaded ] = useState("none");

    useEffect(() => {
        console.log('New Config', configID)

        let xhr = new XMLHttpRequest();
        xhr.open("POST", `${BASE_URL}/api/init`)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.addEventListener('load', () => setLoaded(configID))
        xhr.addEventListener('error', console.error)
        xhr.send(JSON.stringify({'id': configID}))
    }, [ configID ])

    return loaded
}

export function useSkeletonGrid(domain, configID) {
    const [skeletonGrid, setSkeletonGrid] = useState([])
    useEffect(() => {
        if (domain.length === 0) {
            console.log("Abort fetching skeleton grid! Domain is empty...");
            return;
        }

        if (configID == "none") {
            return;
        }
    
        console.log("Fetch Skeleton Grid!", domain);

        fetch(`${BASE_URL}/api/data/skeleton_grid/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                xrange: domain[0],
                yrange: domain[1]
            })
        })
        .then(res => res.json())
        .then(setSkeletonGrid)
        .catch(console.warn)

    }, [domain, configID])

    return skeletonGrid
}


export function useReconstructedSkeleton(hoverData, configID) {
    const [reconstructed, setReconstructed] = useState({data: undefined, type: undefined})
    const [ isLoading, setIsLoading ] = useState(false);

    useEffect(() => {
        if (hoverData.latent_code.length === 0) {
            setReconstructed({data: undefined, type: undefined})
            return;
        }


        if (configID == "none") {
            return;
        }

        if (!isLoading) {
            setIsLoading(true)
            fetch(`${BASE_URL}/api/data/decode/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(hoverData)
            })
            .then(res => res.json())
            .then(setReconstructed)
            .then(() => setIsLoading(false))
            .catch(console.warn)
            }
        }
        
    , [ hoverData, configID ])
    return reconstructed
}

export function useOriginalSkeleton(hoverData, configID) {
    const [original, setOriginal] = useState({data: undefined, type: undefined})
    
    useEffect(() => {
        if (hoverData.latent_code.length === 0) {
            setOriginal({data: undefined, type: undefined})
            return;
        }


        if (configID == "none") {
            return;
        }

        if (hoverData.index != null) {
            fetch(`${BASE_URL}/api/data/skeleton/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(hoverData)
            })
            .then(res => res.json())
            .then(setOriginal)
            .catch(console.warn)
        } else {
            setOriginal({data: undefined, type: undefined})
        } 
    } 
    , [ hoverData, configID ])

    return original
}

export function useReferents(configID) {
    const [referents, setReferents] = useState({data: []})

    useEffect(() => {
        console.log('Fetching CR Data')


        if (configID == "none") {
            return;
        }

        fetch(`${BASE_URL}/api/data/referents`)
        .then(res => res.json())
        .then(setReferents)
        .catch(err => {
            console.log(err)
        })
    }
    , [configID])

    return referents
}

function get_selected_gestures(gestures) {
    return Object.entries(gestures)
        .filter((selected_entry) => selected_entry[1] === true)
        .map((selected_entry) => selected_entry[0])
}

const defaultTrialData = {data: []};
export function useLatentTrialData(gestures, configID) {
    const [trialData, setTrialData] = useState(defaultTrialData);

    useEffect(() => {
        let selected_gestures = get_selected_gestures(gestures);
        
        if (configID == "none") {
            return;
        }

        if (selected_gestures.length === 0) {
            console.log('Fetching latent trial data aborted! No gestures selected');
            setTrialData(defaultTrialData)
            return;
        }

        console.log('Fetching latent trial data', gestures);

        fetch(`${BASE_URL}/api/data/trials/values`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({gesture_type: selected_gestures})
        })
        .then(res => res.json())
        .then(setTrialData)
        .catch(err => {
            console.log(err)
        })
    }
    , [gestures, configID])

    return trialData
}

const EMPTY_BARYCENTER_DATA = { data: [] }
export function useBaryCenters(gestures, configID) {
    const [barycenters, setBaryenters] = useState(EMPTY_BARYCENTER_DATA)
    useEffect(() => {
        let selected_gestures = get_selected_gestures(gestures);


        if (configID == "none") {
            return;
        }
        
        if (selected_gestures.length === 0) {
            console.log('Fetching barycenter data aborted! No gestures selected');
            setBaryenters(EMPTY_BARYCENTER_DATA);
        } else {
            console.log('Fetching barycenter data', gestures);

            fetch(`${BASE_URL}/api/data/barycenters`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gesture_type: selected_gestures,
                    configID: configID,
                })
            })
            .then(res => res.json())
            .then(setBaryenters)
            .catch(console.error)
        }
    }
    , [ gestures, configID ])

    return barycenters
}


const DEFAULT_CLUSTERING_CONFIG = {}
const DEFAULT_CONFIG_LIST = []
export function useClusteringConfig(referents, newConfig, configID) {
    const [ config , setConfig ] = useState(DEFAULT_CLUSTERING_CONFIG);
    const [ configStatus, setConfigStatus ] = useState({});
    const [ configList, setConfigList ] = useState(DEFAULT_CONFIG_LIST);
    const poller = useRef(null);
    
    
    useEffect(() => {
        console.log("Init Clustering Config", referents)


        if (configID == "none") {
            return;
        }

        if ( referents !== undefined ) {
           setConfig(
               Object.fromEntries(referents.data.map(ref => 
                [ref.GestureType, { 
                    K: 3,
                    centroids: [],
                    centroid_names: ["Centroid 0", "Centroid 1", "Centroid 2"],
                    uid: undefined
                }]))
           )
        }

    }, [referents, configID])

    useEffect(() => {
        console.log("New Config", newConfig)


        if (configID == "none") {
            return;
        }

        if (newConfig !== undefined) {
            let update = {...config}
            let referent = newConfig.key
            let newK = newConfig.change.K
            let action = newConfig.change.action
            let centroid = newConfig.change.centroid
            let reassignment = newConfig.change.predictions

            if (action !== undefined) {
                if (action === 'load') {
                    console.info('Load existing cluster run!', referent)
                    
                    fetch(`${BASE_URL}/api/cluster/list`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            referent: referent
                        })
                    })
                        .then(res => res.json())
                        .then(json => {
                            
                            if (json.length === 0) {
                                setConfigStatus(prev => ({...prev, status: "No configurations to load"}))
                                setConfigList(json)
                            } else {
                                setConfigStatus(prev => ({...prev, status: "Configurationlist loaded"}))
                                setConfigList(json)
                            }

                        })
                        .catch(console.error)

                } else if (action === 'rerun') {
                    console.info('Trigger new clustering')

                    if ( config[referent].K !== config[referent].centroids.length ) {
                        console.error('K does not match number of intialized centroids', config[referent].K, config[referent].centroids)
                        return;
                    }
                    
                    fetch(`${BASE_URL}/api/cluster/trigger/rid`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            rid: referent,
                            k: config[referent].K,
                            init: config[referent].centroids,
                            centroid_names: config[referent].centroid_names
                        })
                    })
                        .then(res => res.json())
                        .then(json => setConfigStatus(json))
                        .catch(console.error)

                } else if (action === 'load_config_item') {
                    fetch(`${BASE_URL}/api/cluster/id/${newConfig.change.id}`)
                        .then(res => res.json())
                        .then(json => {

                            setConfigStatus(prev => ({...prev,
                                referent: referent,
                                status: "Configurations Loaded"
                            }))
    
                            setConfig(prev => ({
                                ...prev,
                                [referent]: {
                                    ...prev[referent],
                                    K: json.K,
                                    centroids: json.centroids ? json.centroids : [],
                                    predictions: json.predictions ? json.predictions : [],
                                    uid: newConfig.change.id,
                                    centroid_names: json.centroid_names ? json.centroid_names : []
                                }
                            }))
                           
                        })
                        .catch(console.error)
                        }
            }
            
            let {centroid_idx, centroid_name} = newConfig.change;
            if (centroid_idx !== undefined && centroid_name !== undefined) {
                update[referent].centroid_names[centroid_idx] = centroid_name;
            }

            if (reassignment != undefined) {
                update[referent].predictions[reassignment.idx].cls_asign = reassignment.new_assign
            }

            if (newK !== undefined) {
                update[referent].K = parseInt(newK);
            }

            if (centroid !== undefined) {
                let cid = centroid.idx
                let cdata = centroid.data

                update[referent].centroids[cid] = cdata
            }



            console.log('Updated config', update)
            setConfig(update)
        }

    }, [newConfig, configID])

    useEffect(() => {
        clearInterval(poller.current);
        poller.current = null;
        
        if (configStatus.status_link !== undefined) {
            poller.current = setInterval(() => {
                fetch(`${BASE_URL}/api/${configStatus.status_link}`)
                .then(res => res.json())
                .then(json => {
                    setConfigStatus(prev => ({...prev, ...json}))

                    if (json.status !== "RUNNING") {
                        clearInterval(poller.current);
                        poller.current = null;
                    }
                })
                .catch(console.error)
            }, 3000)
        }
    }, [ configStatus.status_link ])

    useEffect(() => {
        if (configStatus.status === "FINISHED") {
            let referent = configStatus.referent;
            let clusterID = configStatus.id

            fetch(`${BASE_URL}/api/cluster/id/${clusterID}`)
                .then(res => res.json())
                .then(json => {
                    setConfig(prev => ({
                        ...prev,
                        [referent]: {
                            ...prev[referent],
                            centroids: json.centroids,
                            predictions: json.predictions,
                            uid: clusterID,
                            centroid_names: json.centroid_names,

                        }
                    }))
                })
                .catch(console.error)
        }
    }, [ configStatus.status ])


    return [config, configStatus, configList]
}


export function fetch_barycenter(callback, referent, configID) {
    fetch(`${BASE_URL}/api/data/barycenter_reconstruction`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({
            'referent': referent,
            'configID': configID
        })
    })
    .then(res => res.json())
    .then(json => {
        callback(json)
    })
}

export function fetch_animation_data(item, callback) {
    if ( item.ParticipantID !== undefined && item.TrialID !== undefined ) {
        console.log('fetch original data')
        fetch(`${BASE_URL}/api/data/raw/gesture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rid: item.GestureType,
                pid: item.ParticipantID,
                tid: item.TrialID})
        })
        .then(res => res.json())
        .then(callback)
        .catch(console.error)

    } else {
        console.log('Fetch reconstructed data')
        fetch(`${BASE_URL}/api/data/decode/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latent_code: item.z1.map((coord, i) => [item.z1[i], item.z2[i]])
            })
        })
        .then(res => res.json())
        .then(callback)
        .catch(console.error)
    }
}