import { Project, Service } from './types.ts';

export const ADMIN_USERNAME = "Platinum";
export const ADMIN_PASSWORD = "jesussaves1@";
export const ADDRESS = "Plot 5 Road 1 ODANI GREEN Estate, Off East West Road, Elelenwo, Port Harcourt";

export const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
    title: 'Construction & Fabrication',
    icon: 'Hammer',
    description: 'Piping fabrication, process piping, production headers, and structural erection.',
    details: 'Our fabrication yards are equipped to handle complex piping and structural projects. We specialize in process modules, flowline construction, and tank rehabilitation.'
  },
  {
    id: 's2',
    title: 'Facilities Maintenance',
    icon: 'HardHat',
    description: 'Onshore/offshore facility maintenance, vessel cleaning, and integrity checks.',
    details: 'We provide comprehensive maintenance including blasting, painting, valve services, and rope access for hard-to-reach offshore areas.'
  },
  {
    id: 's3',
    title: 'Project Management',
    icon: 'Briefcase',
    description: 'Turnkey project management from conception to commissioning.',
    details: 'Our PMP-certified managers oversee engineering, procurement, and construction phases to ensure projects are delivered on time and within budget.'
  },
  {
    id: 's4',
    title: 'Procurement & Instrumentation',
    icon: 'Anchor',
    description: 'Supply of bulk steel, valves, and calibration of instrumentation.',
    details: 'We source high-grade bulk materials, line pipes, and offer precision calibration for pressure and temperature instruments.'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'ISO Pentane Piping EPC Works',
    client: 'Greenville LNG Co. Ltd.',
    location: 'Rivers State',
    category: 'Construction',
    year: '2024',
    description: 'Engineering, Procurement, and Construction of ISO Pentane piping systems.',
    status: 'Completed'
  },
  {
    id: 'p2',
    title: 'Repairs to Jereh Propane & Overhead Co',
    client: 'Greenville LNG Co. Ltd.',
    location: 'Rivers State',
    category: 'Maintenance',
    year: '2024',
    description: 'Critical repair works on propane systems and overhead components.',
    status: 'Completed'
  },
  {
    id: 'p3',
    title: 'Platform Major Structural Repair',
    client: 'ExxonMobil / Vandrezzer',
    location: 'Offshore',
    category: 'Maintenance',
    year: '2016',
    description: 'Structural integrity repairs on offshore platforms.',
    status: 'Completed'
  },
  {
    id: 'p4',
    title: 'Instrument Header Works SASPG',
    client: 'Greenville LNG',
    location: 'Rivers State',
    category: 'Instrumentation',
    year: '2025',
    description: 'Installation and calibration of instrument headers.',
    status: 'Ongoing'
  }
];
