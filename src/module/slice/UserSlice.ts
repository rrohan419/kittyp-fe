import { UserProfile } from '@/services/authService';
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

const initialState: UserProfile = {
    id : 0,
    enabled: false,
    phoneCountryCode: '',
    phoneNumber: '',
    uuid: '',
    createdAt: '',
    firstName: '',
    lastName: '',
    email: '',
    accessToken: '',
    roles: [],
    ownerPets: [],
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserData: (state, action: PayloadAction<UserProfile>) => {
            {
                state.id = action.payload.id;
                state.firstName = action.payload.firstName;
                state.lastName = action.payload.lastName;
                state.email = action.payload.email;
                state.roles = action.payload.roles;
                state.enabled = action.payload.enabled;
                state.phoneCountryCode = action.payload.phoneCountryCode;
                state.phoneNumber = action.payload.phoneNumber;
                state.uuid = action.payload.uuid;
                state.createdAt = action.payload.createdAt;
                state.ownerPets = action.payload.ownerPets;
            }
        },
        resetUserData: (state) => {
            state.firstName = '';
            state.lastName = '';
            state.email = '';
            state.accessToken = '';
            state.roles = [];
            state.phoneNumber = '';
            state.uuid = '';
            state.createdAt ='';
            state.phoneCountryCode = '';
            state.enabled = false;
            state.ownerPets = [];
        },
        setUserAccessToken: (state, action: PayloadAction<string>) => {
            state.accessToken = action.payload;
        },
        setUserRoles:(state, action: PayloadAction<string[]>) => {
            state.roles = action.payload;
        }
    },
});

export const { setUserData, resetUserData, setUserAccessToken, setUserRoles } = userSlice.actions