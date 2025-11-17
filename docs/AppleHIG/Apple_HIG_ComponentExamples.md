# iOS Component Examples for Web
## React/Next.js Implementation Guide for JiGR

---

## 📱 BUTTON COMPONENTS

### Primary Button (Filled)
```jsx
// components/IOSButton.jsx
import styled from 'styled-components';

const IOSButton = styled.button`
  /* Touch Target */
  min-width: 44pt;
  min-height: 44pt;
  padding: 12pt 20pt;
  
  /* Appearance */
  background: rgb(0, 122, 255); /* iOS Blue */
  color: white;
  border: none;
  border-radius: 12pt;
  
  /* Typography */
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17pt;
  font-weight: 600;
  
  /* Interaction */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  cursor: pointer;
  transition: opacity 0.15s ease;
  
  /* States */
  &:active {
    opacity: 0.7;
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  /* Focus visible for keyboard navigation */
  &:focus-visible {
    outline: 3px solid rgba(0, 122, 255, 0.5);
    outline-offset: 2px;
  }
`;

// Usage
<IOSButton onClick={handleSave}>
  Save Document
</IOSButton>
```

### Secondary Button (Outlined)
```jsx
const SecondaryButton = styled(IOSButton)`
  background: transparent;
  color: rgb(0, 122, 255);
  border: 2px solid rgb(0, 122, 255);
  
  &:active {
    background: rgba(0, 122, 255, 0.1);
    opacity: 1;
  }
`;
```

### Destructive Button (Red)
```jsx
const DestructiveButton = styled(IOSButton)`
  background: rgb(255, 59, 48); /* iOS Red */
  
  &:active {
    opacity: 0.7;
  }
`;

// Usage with confirmation
<DestructiveButton onClick={() => {
  if (confirm('Are you sure you want to delete this?')) {
    handleDelete();
  }
}}>
  Delete
</DestructiveButton>
```

### Text Button (Tertiary)
```jsx
const TextButton = styled.button`
  min-width: 44pt;
  min-height: 44pt;
  padding: 8pt 12pt;
  
  background: transparent;
  color: rgb(0, 122, 255);
  border: none;
  
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17pt;
  font-weight: 400;
  
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  cursor: pointer;
  transition: opacity 0.15s ease;
  
  &:active {
    opacity: 0.4;
  }
`;
```

---

## 📋 LIST COMPONENTS

### Basic List
```jsx
// components/IOSList.jsx
const ListContainer = styled.div`
  background: white;
  border-radius: 12pt;
  overflow: hidden;
  margin: 16pt 20pt;
`;

const ListItem = styled.div`
  min-height: 44pt;
  padding: 12pt 16pt;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.12);
  
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  transition: background-color 0.15s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background-color: ${props => props.clickable ? 'rgba(0, 0, 0, 0.05)' : 'transparent'};
  }
`;

const ListTitle = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17pt;
  font-weight: 400;
  color: black;
`;

const ListSubtitle = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 15pt;
  font-weight: 400;
  color: rgba(60, 60, 67, 0.6);
  margin-top: 2pt;
`;

const Chevron = styled.span`
  font-size: 20pt;
  color: rgba(60, 60, 67, 0.3);
  margin-left: 8pt;
`;

// Usage
<ListContainer>
  <ListItem clickable onClick={() => navigate('/settings')}>
    <div>
      <ListTitle>Settings</ListTitle>
      <ListSubtitle>App preferences</ListSubtitle>
    </div>
    <Chevron>›</Chevron>
  </ListItem>
  
  <ListItem clickable onClick={() => navigate('/profile')}>
    <ListTitle>Profile</ListTitle>
    <Chevron>›</Chevron>
  </ListItem>
  
  <ListItem>
    <ListTitle>Version</ListTitle>
    <span style={{ color: 'rgba(60,60,67,0.6)' }}>1.0.0</span>
  </ListItem>
</ListContainer>
```

### List with Icons
```jsx
const IconContainer = styled.div`
  width: 28pt;
  height: 28pt;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12pt;
  border-radius: 6pt;
  background: ${props => props.color || 'rgba(0,0,0,0.1)'};
`;

<ListItem clickable onClick={handleClick}>
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <IconContainer color="rgb(0, 122, 255)">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
        {/* Icon path */}
      </svg>
    </IconContainer>
    <ListTitle>Documents</ListTitle>
  </div>
  <Chevron>›</Chevron>
</ListItem>
```

---

## 🔘 FORM CONTROLS

### Text Input
```jsx
// components/IOSTextField.jsx
const TextFieldContainer = styled.div`
  margin: 12pt 0;
`;

const Label = styled.label`
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 13pt;
  font-weight: 400;
  color: rgba(60, 60, 67, 0.6);
  margin-bottom: 6pt;
  padding: 0 16pt;
`;

const InputWrapper = styled.div`
  position: relative;
  padding: 0 16pt;
`;

const Input = styled.input`
  width: 100%;
  min-height: 44pt;
  padding: 12pt 40pt 12pt 12pt; /* Extra padding for clear button */
  
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17pt;
  font-weight: 400;
  color: black;
  
  background: rgba(118, 118, 128, 0.12);
  border: none;
  border-radius: 10pt;
  
  -webkit-appearance: none;
  -webkit-tap-highlight-color: transparent;
  
  &:focus {
    outline: none;
    background: rgba(118, 118, 128, 0.16);
  }
  
  &::placeholder {
    color: rgba(60, 60, 67, 0.3);
  }
  
  /* Remove default clear button on Safari */
  &::-webkit-search-cancel-button {
    display: none;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 28pt;
  top: 50%;
  transform: translateY(-50%);
  
  width: 28pt;
  height: 28pt;
  padding: 0;
  
  background: rgba(118, 118, 128, 0.24);
  border: none;
  border-radius: 50%;
  
  display: ${props => props.show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  cursor: pointer;
  
  &:active {
    background: rgba(118, 118, 128, 0.36);
  }
`;

// Component
const IOSTextField = ({ label, value, onChange, placeholder, type = "text" }) => {
  const [isFocused, setIsFocused] = React.useState(false);
  
  const handleClear = () => {
    onChange({ target: { value: '' } });
  };
  
  return (
    <TextFieldContainer>
      {label && <Label>{label}</Label>}
      <InputWrapper>
        <Input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-label={label}
        />
        <ClearButton
          show={value.length > 0 && isFocused}
          onClick={handleClear}
          type="button"
          aria-label="Clear"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.5 10.1l-1.4 1.4L8 9.4l-2.1 2.1-1.4-1.4L6.6 8 4.5 5.9l1.4-1.4L8 6.6l2.1-2.1 1.4 1.4L9.4 8l2.1 2.1z"/>
          </svg>
        </ClearButton>
      </InputWrapper>
    </TextFieldContainer>
  );
};
```

### Toggle Switch
```jsx
// components/IOSSwitch.jsx
const SwitchContainer = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44pt;
  padding: 8pt 16pt;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
`;

const SwitchLabel = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17pt;
  font-weight: 400;
  color: black;
`;

const SwitchTrack = styled.div`
  position: relative;
  width: 51pt;
  height: 31pt;
  background: ${props => props.checked ? 'rgb(52, 199, 89)' : 'rgba(120, 120, 128, 0.16)'};
  border-radius: 31pt;
  transition: background-color 0.3s ease;
  
  /* Accessibility */
  &:focus-within {
    outline: 3px solid rgba(52, 199, 89, 0.5);
    outline-offset: 2px;
  }
`;

const SwitchThumb = styled.div`
  position: absolute;
  top: 2pt;
  left: ${props => props.checked ? '22pt' : '2pt'};
  width: 27pt;
  height: 27pt;
  background: white;
  border-radius: 50%;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0, 0, 0, 0.16);
  transition: left 0.3s ease;
`;

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

// Component
const IOSSwitch = ({ label, checked, onChange }) => {
  return (
    <SwitchContainer>
      <SwitchLabel>{label}</SwitchLabel>
      <SwitchTrack checked={checked}>
        <HiddenCheckbox
          checked={checked}
          onChange={onChange}
          aria-label={label}
        />
        <SwitchThumb checked={checked} />
      </SwitchTrack>
    </SwitchContainer>
  );
};
```

---

## 🎯 NAVIGATION COMPONENTS

### Navigation Bar
```jsx
// components/IOSNavBar.jsx
const NavBarContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50pt; /* iPad height */
  background: rgba(248, 248, 248, 0.94);
  backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16pt;
  z-index: 1000;
  
  /* Safe area support */
  padding-top: env(safe-area-inset-top, 0);
`;

const NavTitle = styled.h1`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17pt;
  font-weight: 600;
  color: black;
  margin: 0;
`;

const NavButton = styled.button`
  min-width: 44pt;
  min-height: 44pt;
  padding: 8pt 12pt;
  background: transparent;
  border: none;
  color: rgb(0, 122, 255);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17pt;
  font-weight: 400;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: opacity 0.15s ease;
  
  &:active {
    opacity: 0.4;
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const BackButton = styled(NavButton)`
  display: flex;
  align-items: center;
  gap: 4pt;
  
  &::before {
    content: '‹';
    font-size: 28pt;
    line-height: 1;
  }
`;

// Component
const IOSNavBar = ({ title, onBack, rightAction, rightLabel = "Done" }) => {
  return (
    <NavBarContainer>
      {onBack && (
        <BackButton onClick={onBack} aria-label="Back">
          {title || "Back"}
        </BackButton>
      )}
      <NavTitle>{title}</NavTitle>
      {rightAction && (
        <NavButton onClick={rightAction}>
          {rightLabel}
        </NavButton>
      )}
    </NavBarContainer>
  );
};
```

### Tab Bar
```jsx
// components/IOSTabBar.jsx
const TabBarContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50pt; /* iPad height */
  background: rgba(248, 248, 248, 0.94);
  backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(0, 0, 0, 0.12);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: 1000;
`;

const TabButton = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 44pt;
  padding: 4pt 8pt;
  background: transparent;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: opacity 0.15s ease;
  
  &:active {
    opacity: 0.6;
  }
`;

const TabIcon = styled.div`
  width: 28pt;
  height: 28pt;
  margin-bottom: 2pt;
  color: ${props => props.active ? 'rgb(0, 122, 255)' : 'rgba(60, 60, 67, 0.6)'};
  transition: color 0.15s ease;
`;

const TabLabel = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 10pt;
  font-weight: 400;
  color: ${props => props.active ? 'rgb(0, 122, 255)' : 'rgba(60, 60, 67, 0.6)'};
  transition: color 0.15s ease;
`;

const Badge = styled.span`
  position: absolute;
  top: 2pt;
  right: -6pt;
  min-width: 18pt;
  height: 18pt;
  padding: 0 6pt;
  background: rgb(255, 59, 48);
  color: white;
  font-size: 12pt;
  font-weight: 600;
  border-radius: 9pt;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Component
const IOSTabBar = ({ tabs, activeTab, onTabChange }) => {
  return (
    <TabBarContainer>
      {tabs.map((tab, index) => (
        <TabButton
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          <div style={{ position: 'relative' }}>
            <TabIcon active={activeTab === tab.id}>
              {tab.icon}
            </TabIcon>
            {tab.badge && <Badge>{tab.badge}</Badge>}
          </div>
          <TabLabel active={activeTab === tab.id}>
            {tab.label}
          </TabLabel>
        </TabButton>
      ))}
    </TabBarContainer>
  );
};
```

---

## 💬 MODAL COMPONENTS

### Sheet Modal (Bottom Sheet)
```jsx
// components/IOSSheet.jsx
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9998;
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: ${props => props.show ? 'auto' : 'none'};
`;

const SheetContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 90vh;
  background: white;
  border-radius: 12pt 12pt 0 0;
  z-index: 9999;
  transform: translateY(${props => props.show ? '0' : '100%'});
  transition: transform 0.3s ease;
  overflow: hidden;
  
  /* Safe area support */
  padding-bottom: env(safe-area-inset-bottom, 0);
`;

const SheetHeader = styled.div`
  padding: 12pt 16pt;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SheetTitle = styled.h2`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17pt;
  font-weight: 600;
  color: black;
  margin: 0;
`;

const SheetContent = styled.div`
  padding: 16pt;
  overflow-y: auto;
  max-height: calc(90vh - 60pt);
`;

const CloseButton = styled.button`
  width: 44pt;
  height: 44pt;
  background: rgba(118, 118, 128, 0.12);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background 0.15s ease;
  
  &:active {
    background: rgba(118, 118, 128, 0.24);
  }
`;

// Component
const IOSSheet = ({ show, onClose, title, children }) => {
  React.useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);
  
  return (
    <>
      <Overlay show={show} onClick={onClose} />
      <SheetContainer show={show}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <CloseButton onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="rgba(60,60,67,0.6)">
              <path d="M1.5 1.5l13 13m-13 0l13-13" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </CloseButton>
        </SheetHeader>
        <SheetContent>
          {children}
        </SheetContent>
      </SheetContainer>
    </>
  );
};
```

### Alert Dialog
```jsx
// components/IOSAlert.jsx
const AlertOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: ${props => props.show ? 'auto' : 'none'};
`;

const AlertBox = styled.div`
  width: 90%;
  max-width: 270pt;
  background: rgba(248, 248, 248, 0.94);
  backdrop-filter: blur(20px);
  border-radius: 14pt;
  overflow: hidden;
  transform: scale(${props => props.show ? 1 : 0.9});
  transition: transform 0.3s ease;
`;

const AlertTitle = styled.h3`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17pt;
  font-weight: 600;
  color: black;
  text-align: center;
  margin: 20pt 16pt 8pt;
`;

const AlertMessage = styled.p`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 13pt;
  font-weight: 400;
  color: black;
  text-align: center;
  margin: 0 16pt 20pt;
  line-height: 1.4;
`;

const AlertActions = styled.div`
  border-top: 0.5px solid rgba(0, 0, 0, 0.12);
  display: flex;
`;

const AlertButton = styled.button`
  flex: 1;
  min-height: 44pt;
  padding: 12pt;
  background: transparent;
  border: none;
  border-right: ${props => props.bordered ? '0.5px solid rgba(0, 0, 0, 0.12)' : 'none'};
  
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17pt;
  font-weight: ${props => props.primary ? 600 : 400};
  color: ${props => props.destructive ? 'rgb(255, 59, 48)' : 'rgb(0, 122, 255)'};
  
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background 0.15s ease;
  
  &:active {
    background: rgba(0, 0, 0, 0.05);
  }
`;

// Component
const IOSAlert = ({ show, onClose, title, message, actions }) => {
  return (
    <AlertOverlay show={show} onClick={onClose}>
      <AlertBox show={show} onClick={(e) => e.stopPropagation()}>
        {title && <AlertTitle>{title}</AlertTitle>}
        {message && <AlertMessage>{message}</AlertMessage>}
        <AlertActions>
          {actions.map((action, index) => (
            <AlertButton
              key={index}
              onClick={action.onPress}
              primary={action.style === 'default'}
              destructive={action.style === 'destructive'}
              bordered={index < actions.length - 1}
            >
              {action.text}
            </AlertButton>
          ))}
        </AlertActions>
      </AlertBox>
    </AlertOverlay>
  );
};

// Usage
<IOSAlert
  show={showAlert}
  onClose={() => setShowAlert(false)}
  title="Delete Document?"
  message="This action cannot be undone."
  actions={[
    { text: 'Cancel', onPress: () => setShowAlert(false) },
    { text: 'Delete', style: 'destructive', onPress: handleDelete }
  ]}
/>
```

---

## 📊 FEEDBACK COMPONENTS

### Loading Spinner
```jsx
// components/IOSSpinner.jsx
const SpinnerContainer = styled.div`
  display: inline-block;
  width: ${props => props.size || 20}pt;
  height: ${props => props.size || 20}pt;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const SpinnerSVG = styled.svg`
  width: 100%;
  height: 100%;
`;

const IOSSpinner = ({ size = 20, color = 'rgba(60, 60, 67, 0.3)' }) => {
  return (
    <SpinnerContainer size={size} role="status" aria-label="Loading">
      <SpinnerSVG viewBox="0 0 50 50">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="31.4 31.4"
        />
      </SpinnerSVG>
    </SpinnerContainer>
  );
};
```

### Progress Bar
```jsx
// components/IOSProgress.jsx
const ProgressContainer = styled.div`
  width: 100%;
  height: 4pt;
  background: rgba(118, 118, 128, 0.12);
  border-radius: 2pt;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: rgb(0, 122, 255);
  border-radius: 2pt;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const IOSProgress = ({ progress }) => {
  return (
    <ProgressContainer role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
      <ProgressBar progress={progress} />
    </ProgressContainer>
  );
};
```

### Toast Notification
```jsx
// components/IOSToast.jsx
const ToastContainer = styled.div`
  position: fixed;
  top: ${props => props.show ? '60pt' : '-100pt'};
  left: 50%;
  transform: translateX(-50%);
  max-width: 90%;
  padding: 12pt 20pt;
  background: rgba(60, 60, 67, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12pt;
  z-index: 10001;
  transition: top 0.3s ease;
  
  /* Safe area support */
  top: ${props => props.show 
    ? 'calc(env(safe-area-inset-top, 0) + 60pt)' 
    : '-100pt'};
`;

const ToastText = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 15pt;
  font-weight: 400;
  color: white;
`;

const IOSToast = ({ show, message, duration = 3000, onClose }) => {
  React.useEffect(() => {
    if (show && duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);
  
  return (
    <ToastContainer show={show}>
      <ToastText>{message}</ToastText>
    </ToastContainer>
  );
};
```

---

## 🎨 CARD COMPONENT

```jsx
// components/IOSCard.jsx
const Card = styled.div`
  background: white;
  border-radius: 12pt;
  padding: 16pt;
  margin: 16pt 20pt;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  /* Tap feedback for clickable cards */
  ${props => props.clickable && `
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    
    &:active {
      transform: scale(0.98);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }
  `}
`;

const CardTitle = styled.h3`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17pt;
  font-weight: 600;
  color: black;
  margin: 0 0 8pt 0;
`;

const CardBody = styled.p`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 15pt;
  font-weight: 400;
  color: rgba(60, 60, 67, 0.6);
  line-height: 1.4;
  margin: 0;
`;

// Usage
<Card clickable onClick={handleCardClick}>
  <CardTitle>Delivery Status</CardTitle>
  <CardBody>3 deliveries pending review</CardBody>
</Card>
```

---

## 🔍 SEARCH BAR

```jsx
// components/IOSSearchBar.jsx
const SearchBarContainer = styled.div`
  padding: 8pt 16pt;
  background: rgba(248, 248, 248, 0.94);
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 10pt;
  width: 16pt;
  height: 16pt;
  color: rgba(60, 60, 67, 0.3);
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 36pt;
  padding: 0 36pt 0 36pt;
  
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17pt;
  font-weight: 400;
  color: black;
  
  background: rgba(118, 118, 128, 0.12);
  border: none;
  border-radius: 10pt;
  
  -webkit-appearance: none;
  -webkit-tap-highlight-color: transparent;
  
  &:focus {
    outline: none;
    background: rgba(118, 118, 128, 0.16);
  }
  
  &::placeholder {
    color: rgba(60, 60, 67, 0.3);
  }
`;

const SearchClearButton = styled.button`
  position: absolute;
  right: 10pt;
  width: 20pt;
  height: 20pt;
  padding: 0;
  
  background: rgba(118, 118, 128, 0.24);
  border: none;
  border-radius: 50%;
  
  display: ${props => props.show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  cursor: pointer;
  
  &:active {
    background: rgba(118, 118, 128, 0.36);
  }
`;

const IOSSearchBar = ({ value, onChange, placeholder = "Search" }) => {
  const handleClear = () => {
    onChange({ target: { value: '' } });
  };
  
  return (
    <SearchBarContainer>
      <SearchInputWrapper>
        <SearchIcon>
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.5 6.5a5 5 0 11-10 0 5 5 0 0110 0zM15.354 15.354l-4.5-4.5"/>
          </svg>
        </SearchIcon>
        <SearchInput
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-label="Search"
        />
        <SearchClearButton
          show={value.length > 0}
          onClick={handleClear}
          type="button"
          aria-label="Clear search"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
            <path d="M1 1l10 10m-10 0L11 1" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </SearchClearButton>
      </SearchInputWrapper>
    </SearchBarContainer>
  );
};
```

---

## 📱 PAGE LAYOUT TEMPLATE

```jsx
// components/IOSPageLayout.jsx
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.background || '#F2F2F7'};
  padding-top: 50pt; /* Nav bar height */
  padding-bottom: ${props => props.hasTabBar ? '50pt' : '0'}; /* Tab bar height */
  
  /* Safe area support */
  padding-top: calc(env(safe-area-inset-top, 0) + 50pt);
  padding-bottom: ${props => props.hasTabBar 
    ? 'calc(env(safe-area-inset-bottom, 0) + 50pt)' 
    : 'env(safe-area-inset-bottom, 0)'};
`;

const PageContent = styled.main`
  max-width: 1024pt; /* iPad max width */
  margin: 0 auto;
  padding: 16pt 0;
`;

// Usage
const MyPage = () => {
  return (
    <>
      <IOSNavBar 
        title="Documents" 
        onBack={() => navigate(-1)}
        rightAction={handleEdit}
        rightLabel="Edit"
      />
      
      <PageContainer hasTabBar>
        <PageContent>
          {/* Your content here */}
          <IOSSearchBar value={search} onChange={setSearch} />
          
          <ListContainer>
            {/* List items */}
          </ListContainer>
        </PageContent>
      </PageContainer>
      
      <IOSTabBar 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </>
  );
};
```

---

## 🎯 JIGR-SPECIFIC UTILITIES

### Document Upload Button
```jsx
// components/DocumentUploadButton.jsx
const UploadButton = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200pt;
  padding: 32pt;
  background: white;
  border: 2px dashed rgba(0, 122, 255, 0.3);
  border-radius: 12pt;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: all 0.15s ease;
  
  &:active {
    transform: scale(0.98);
    border-color: rgba(0, 122, 255, 0.5);
    background: rgba(0, 122, 255, 0.05);
  }
`;

const UploadIcon = styled.div`
  width: 64pt;
  height: 64pt;
  margin-bottom: 16pt;
  color: rgb(0, 122, 255);
`;

const UploadText = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17pt;
  font-weight: 600;
  color: rgb(0, 122, 255);
  text-align: center;
`;

const HiddenInput = styled.input.attrs({ type: 'file', accept: 'image/*' })`
  display: none;
`;

const DocumentUploadButton = ({ onUpload }) => {
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
    }
  };
  
  return (
    <UploadButton>
      <HiddenInput onChange={handleChange} />
      <UploadIcon>
        <svg viewBox="0 0 64 64" fill="currentColor">
          <path d="M32 8v48M12 28l20-20 20 20"/>
        </svg>
      </UploadIcon>
      <UploadText>
        Tap to photograph<br/>delivery docket
      </UploadText>
    </UploadButton>
  );
};
```

### Temperature Badge
```jsx
// components/TemperatureBadge.jsx
const TempBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 6pt 12pt;
  border-radius: 16pt;
  background: ${props => {
    if (props.temp <= 0) return 'rgb(90, 200, 250)'; // Frozen - Teal
    if (props.temp <= 5) return 'rgb(52, 199, 89)'; // Cold - Green
    if (props.temp <= 15) return 'rgb(255, 204, 0)'; // Caution - Yellow
    return 'rgb(255, 59, 48)'; // Danger - Red
  }};
  
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 13pt;
  font-weight: 600;
  color: white;
`;

const TemperatureBadge = ({ temperature }) => {
  return (
    <TempBadge temp={temperature} role="status">
      {temperature}°C
    </TempBadge>
  );
};
```

---

## 📝 NOTES

### Implementation Tips
1. Always test on actual iPad Air (2013) device
2. Use pt units consistently (CSS points)
3. Test all touch targets with actual fingers
4. Verify VoiceOver labels work correctly
5. Check both light and dark mode appearances
6. Test with largest Dynamic Type size
7. Ensure safe area insets are respected

### Performance Optimization
```jsx
// Use React.memo for static components
const IOSButton = React.memo(({ children, ...props }) => {
  return <StyledButton {...props}>{children}</StyledButton>;
});

// Debounce search inputs
const debouncedSearch = useMemo(
  () => debounce((value) => performSearch(value), 300),
  []
);

// Virtualize long lists
import { FixedSizeList } from 'react-window';
```

### Accessibility Checklist
- [ ] All interactive elements have aria-labels
- [ ] Touch targets meet 44pt × 44pt minimum
- [ ] Color contrast meets 4.5:1 ratio
- [ ] Keyboard navigation works (iPad)
- [ ] VoiceOver announces all changes
- [ ] Focus visible styles present
- [ ] Disabled states clearly indicated
- [ ] Loading states announced

---

*Component Library v1.0 | For JiGR Development | React/Next.js Implementation*
