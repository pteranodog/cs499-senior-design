// MOCK MAP COMPONENTS
jest.mock('react-leaflet', () => ({
  useMap: () => ({}),
  useMapEvent: () => {},
  useMapEvents: () => {}
}));
jest.mock('react-leaflet-custom-control', () => () => <div>Mock Control</div>);


// IMPORT TESTING LIBRARIES AND SUBJECT FILE
import '@testing-library/jest-dom'
import { render, screen, fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Controls from '../Controls'


// TEST: TEXT BOX FOR SIMULATION NAME
test('simulation name box can take input', async() => {
  render(<Controls />);

  const nameInput = screen.getByLabelText(/Simulation Name/i);
  await userEvent.type(nameInput, 'Test Simulation');

  expect(nameInput).toHaveValue('Test Simulation');
});


// TEST: START TIME INPUT
test('start time takes input', async() => {
  render(<Controls />);

  const hourInput = screen.getByPlaceholderText('HH');
  const minuteInput = screen.getByPlaceholderText('MM');

  await userEvent.type(hourInput, '17');
  await userEvent.type(minuteInput, '59');

  expect(hourInput).toHaveValue(17);
  expect(minuteInput).toHaveValue(59);
});


//TEST: RUN TIME DURATION INPUT
test('run duration box takes input', async() => {
  render(<Controls />);

  const runTimeInput = screen.getByLabelText(/Duration \(minutes\)/i);
  await userEvent.type(runTimeInput, '2');

  expect(runTimeInput).toHaveValue(2);
});


//TEST: REGION DROPDOWN INPUT
test('user can select a region', async() => {
  render(<Controls />);

  const regionSelect = screen.getByRole('combobox' , { name: /Region/i });

  await userEvent.selectOptions(regionSelect, ['Malacca Strait']);

  expect(regionSelect).toHaveValue('Malacca Strait');
});


// TODO: Weather temporarily removed
// test('user can select weather', async() => {
//   render(<Controls />);
//   const weatherSelect = screen.getByRole('combobox' , {name : /Weather Condition/i});
//   await userEvent.selectOptions(weatherSelect, 'Clear');
//   expect(weatherSelect).toHaveValue('Clear');
// });


//TEST: MERCHANT POPULATION SLIDER
test('merchant population slider works', () => {
  render (<Controls />);

  const merchantSlider = screen.getByLabelText(/Merchant Presence/i)

  fireEvent.change(merchantSlider, { target : {value : 33}});

  expect(merchantSlider).toHaveValue('33');
});


//TEST: PIRATE POPULATION SLIDER
test('pirate population slider works', () => {
  render (<Controls />);

  const pirateSlider = screen.getByLabelText(/Pirate Presence/i)

  fireEvent.change(pirateSlider, { target : {value : 33}});

  expect(pirateSlider).toHaveValue('33');
});


//TEST: SECURITY POPULATION SLIDER
test('security population slider works', () => {
  render (<Controls />);

  const securitySlider = screen.getByLabelText(/Security Presence/i)

  fireEvent.change(securitySlider, { target : {value : 33}});

  expect(securitySlider).toHaveValue('33');
});


// TEST: START BUTTON DISABLED INITIALLY
test('start button starts disabled initially', () => {
  render(<Controls/>);
  const button = screen.getByRole('button', {name : /Start Simulation/i});
  expect(button).toBeDisabled();
});