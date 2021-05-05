import {
  AppBar,
  Button, Container,
  createMuiTheme, ThemeProvider,
  Toolbar
} from '@material-ui/core';
import React, { useMemo } from 'react';
import {
  HashRouter as Router,
  NavLink, Route, Switch
} from "react-router-dom";

import CreateNewConfiguration from './CreateNewConfiguration';
import StartScreen from './StartScreen';
import ToolScreen from './ToolScreen';

export default function App(props) {
  const theme = useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: 'light',
          primary: {
            main: "#81d4fa"
          }
        },
      }),
    [],
  );

  function handleCancelCreateConfiguration() {
    console.log("cancel create config")
  }

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AppBar position='static' style={{ "zIndex": "0" }}>
          { }
          <Toolbar>
            <NavLink to="/home" style={{ textDecoration: 'none' }}>
              <Button >Interactive Gesture Map</Button>
            </NavLink>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" onContextMenu={(evt) => evt.preventDefault()}>
          <Switch>
            <Route path="/new-configuration">
              <CreateNewConfiguration
                handleCancelClicked={handleCancelCreateConfiguration} />
            </Route>
            <Route path="/analyze/:configID">
              <ToolScreen />
            </Route>
            <Route path="/">
              <StartScreen />
            </Route>
          </Switch>
        </Container>
      </Router>
    </ThemeProvider>
  )
}