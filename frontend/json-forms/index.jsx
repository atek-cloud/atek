import { useState, useEffect } from 'react';
import { JsonForms } from '@jsonforms/react';
import { materialCells, materialRenderers } from '@jsonforms/material-renderers'
import { createTheme, CssBaseline, ThemeProvider } from '@material-ui/core'
import { Generate } from '@jsonforms/core'
import React from 'react'
import ReactDOM from 'react-dom'

const theme = createTheme({
  overrides: {
    MuiFormControl: {
      root: {
        margin: '0 0 0.7em 0',
      },
    },
  },
})

window.addEventListener('DOMContentLoaded', e => {
  window.isAppReady = true
  if (!inIframe()) {
    window.app.render({
      schema: {
        type: 'object',
        required: ['foo'],
        properties: {
          foo: {type: 'string'},
          bar: {type: 'number'},
          baz: {type: 'boolean'}
        }
      }
    })
  }
})

let jsonEditorInst
const container = document.getElementById('container')
window.app = {
  render (props = {}) {
    props = JSON.parse(JSON.stringify(props)) // create a copy local to this frame

    if (jsonEditorInst) jsonEditorInst.destroy()
    ReactDOM.unmountComponentAtNode(container)
    container.innerHTML = ''
    container.classList.remove('min-height')

    if (props.schema && (!props.mode || props.mode === 'form')) {
      ReactDOM.render(
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <JsonFormsWrapper
            schema={props.schema || {}}
            uischema={props.uischema || Generate.uiSchema(props.schema)}
            initialData={props.initialData || {}}
          />
        </ThemeProvider>,
        container
      )
    } else {
      jsonEditorInst = new JSONEditor(container, {
        mode: props.readonly ? 'view' : 'form',
        modes: props.readonly ? undefined : ['form', 'code'],
        search: true,
        onModeChange (newMode) {
          if (newMode === 'code') {
            container.classList.add('min-height')
          } else {
            container.classList.remove('min-height')
          }
        },
        onChange () {
          window.dispatchEvent(new CustomEvent('data-change', {detail: {data: jsonEditorInst.get()}}))
        }
      })
      jsonEditorInst.set(props.initialData || {})
    }
  }
}

function JsonFormsWrapper (props) {
  const [jsonformsData, setJsonformsData] = useState(props.initialData);

  return (
    <JsonForms
      schema={props.schema}
      uischema={props.uischema}
      data={jsonformsData}
      renderers={materialRenderers}
      cells={materialCells}
      onChange={({ errors, data }) => window.dispatchEvent(new CustomEvent('data-change', {detail: {data}}))}
    />
  );
};

function inIframe () {
  try {
      return window.self !== window.top;
  } catch (e) {
      return true;
  }
}
