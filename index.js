// From https://github.com/ant-design/ant-design/blob/master/components/modal
import { Component } from 'react';
import ReactDOM from 'react-dom';
import {Button, Modal} from 'react-bootstrap';
import PropTypes from 'prop-types';

class ActionButton extends Component {
  timeoutId;

  static propTypes = {
    autoFocus: PropTypes.bool,
    closeModal: PropTypes.func,
    buttonProps: PropTypes.object,
    type: PropTypes.string,
    actionFn: PropTypes.func,
    children: PropTypes.node,
  };

  constructor(props) {
    super(props);
    this.state = {
      loading: false,
    };
  }

  componentDidMount() {
    if (this.props.autoFocus) {
      /* eslint-disable-next-line react/no-find-dom-node */
      const $this = ReactDOM.findDOMNode(this);
      this.timeoutId = setTimeout(() => $this.focus());
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutId);
  }

  onClick = () => {
    const {actionFn, closeModal} = this.props;
    if (actionFn) {
      let ret;
      if (actionFn.length) {
        ret = actionFn(closeModal);
      } else {
        ret = actionFn();
        if (!ret) {
          closeModal();
        }
      }
      if (ret && ret.then) {
        this.setState({loading: true});
        ret.then((...args) => {
          // It's unnecessary to set loading=false, for the Modal will be unmounted after close.
          // this.setState({ loading: false });
          closeModal(...args);
        }, () => {
          // See: https://github.com/ant-design/ant-design/issues/6183
          this.setState({loading: false});
        });
      }
    } else {
      closeModal();
    }
  };

  render() {
    const {type, children, buttonProps} = this.props;
    const loading = this.state.loading;
    return (
      <Button variant={type} onClick={this.onClick} disabled={loading} {...buttonProps}>
        {children}
      </Button>
    );
  }
}

const defaults = {
  okType: 'outline-primary',
  okText: '确定',
  cancelText: '取消',
};

const ConfirmDialog = (props) => {
  const {
    onOk,
    onCancel,
    close,
    show,
    okButtonProps,
    cancelButtonProps,
    content,
    html = false,
    centered = true,
    okType = defaults.okType,
    title = '',
    okText = defaults.okText,
    cancelText = defaults.cancelText,
    okCancel = true,
    autoFocusButton = 'ok',
    ...rest
  } = props;

  const cancelButton = okCancel && (
    <ActionButton type="secondary" actionFn={onCancel} closeModal={close}
      autoFocus={autoFocusButton === 'cancel'}
      buttonProps={cancelButtonProps}>
      {cancelText}
    </ActionButton>
  );

  return (
    <Modal
      show={show}
      backdrop="static"
      centered={centered}
      autoFocus={false}
      className="modal-prompt modal-zoom"
      dialogClassName="modal-dialog-scrollable"
      {...rest}
    >
      {title && <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>}
      <Modal.Body>
        <div className="modal-text" dangerouslySetInnerHTML={html ? {__html: content} : null}>
          {html ? null : content}
        </div>
      </Modal.Body>
      <Modal.Footer>
        {cancelButton}
        <ActionButton type={okType} actionFn={onOk} closeModal={close} autoFocus={autoFocusButton === 'ok'}
          buttonProps={okButtonProps}>
          {okText}
        </ActionButton>
      </Modal.Footer>
    </Modal>
  );
};

ConfirmDialog.propTypes = {
  title: PropTypes.string,
  okType: PropTypes.string,
  okText: PropTypes.string,
  cancelText: PropTypes.string,
  okCancel: PropTypes.bool,
  autoFocusButton: PropTypes.string,
  centered: PropTypes.bool,
  html: PropTypes.bool,
  content: PropTypes.node,
  cancelButtonProps: PropTypes.object,
  okButtonProps: PropTypes.object,
  show: PropTypes.bool,
  close: PropTypes.func,
  onCancel: PropTypes.func,
  onOk: PropTypes.func,
};

function confirm(config) {
  if (typeof config.content === 'undefined') {
    config = {content: config};
  }

  var div = document.createElement('div');
  document.body.appendChild(div);

  let currentConfig = addPromise({...config, close, show: true});

  let ok;
  let cancel;
  let callback;
  const result = new Promise(resolve => {
    callback = resolve;
  });
  result.ok = fn => {
    ok = fn;
    return result;
  };
  result.cancel = fn => {
    cancel = fn;
    return result;
  };

  function addPromise(config) {
    const onOk = config.onOk;
    config.onOk = () => {
      callback(true);
      const result = ok && ok();
      const result2 = onOk && onOk();
      return result || result2;
    };

    const onCancel = config.onCancel;
    config.onCancel = () => {
      callback(false);
      const result = cancel && cancel();
      const result2 = onCancel && onCancel();
      return result || result2;
    };

    return config;
  }

  function close(...args) {
    currentConfig = {
      ...currentConfig,
      show: false,
      onExited: destroy.bind(this, ...args),
    };
    render(currentConfig);
  }

  function update(newConfig) {
    newConfig = addPromise(newConfig);
    currentConfig = {
      ...currentConfig,
      ...newConfig,
    };
    render(currentConfig);
  }

  function destroy(...args) {
    const unmountResult = ReactDOM.unmountComponentAtNode(div);
    if (unmountResult && div.parentNode) {
      div.parentNode.removeChild(div);
    }
    const triggerCancel = args && args.length &&
      args.some(param => param && param.triggerCancel);
    if (config.onCancel && triggerCancel) {
      config.onCancel(...args);
    }
  }

  function render(props) {
    ReactDOM.render(<ConfirmDialog {...props} />, div);
  }

  render(currentConfig);

  result.destroy = close;
  result.update = update;
  return result;
}

confirm.alert = (config) => {
  if (typeof config.content === 'undefined') {
    config = {content: config};
  }

  return confirm({
    okCancel: false,
    ...config,
  });
};

confirm.defaults = defaults;

export default confirm;
