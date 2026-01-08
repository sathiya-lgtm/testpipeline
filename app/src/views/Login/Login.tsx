// React
import {
    ReactElement,
    FC,
    useContext,
    useState,
    useEffect,
    useRef,
} from 'react';
import {
    Link,
    useNavigate,
    useSearchParams,
    useLocation,
} from 'react-router-dom';

// Third Party
import { GoEye, GoEyeClosed } from 'react-icons/go';

// Contexts
import { AuthContext } from '../../contexts/AuthProvider';

// Controller
import { handleLogin } from './Login.controller';

// Components
import LoadingModal from '../../components/Modals/LoadingModal';

// Icons
import AdminUserIcon from '../../images/icons/EV.admin.svg?react';

// Styles
import '../../styles/views/Login.scss';

/**
 * Component for rendering the Login page.
 * The page from which an unauthenticated user can enter a username and attempt providing
 * a password to assume that user's identity. Redirect to "/" upon success.
 * @returns {ReactElement} Login page / view.
 */

interface IProps {
    navigatePathAfterLogin: string;
}

interface QueryParams {
    auth: string | undefined;
}

const useQuery = (): QueryParams => {
    const query = new URLSearchParams(useLocation().search);
    return {
        auth: query.get('auth') ?? undefined,
    };
};

const Login: FC<IProps> = ({ navigatePathAfterLogin }): ReactElement => {
    const navigate = useNavigate();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { auth } = useQuery();
    const [searchParams] = useSearchParams();
    const { activeUser, setActiveUser, userLoggedIn, setUserLoggedIn } =
        useContext(AuthContext);
    const [isLoading, setIsLoading] = useState<boolean>(false); // Used to determine whether loading animation should be displayed on screen.
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loginError, setLoginError] = useState<string | null>(null); // Error message displayed on screen if log in fails.

    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

    useEffect(() => {
        if (activeUser && userLoggedIn) {
            const mac = searchParams.get('mac');
            const name = searchParams.get('name');
            const device = searchParams.get('device');
            let navPath = navigatePathAfterLogin;

            if (mac) {
                navPath += `&mac=${mac}`;
            }

            if (name) {
                navPath += `&name=${name}`;
            }

            if (device) {
                navPath += `&device=${device}`;
            }

            navigate(navPath);
        }
    }, [activeUser, userLoggedIn, searchParams]);

    useEffect(() => {
        if (auth) {
            const authRequest = JSON.parse(atob(auth));

            let hasEmail: boolean = false;
            let hasPassword: boolean = false;
            console.log(authRequest);

            if (
                authRequest.email !== undefined &&
                authRequest.email !== null &&
                authRequest.email !== ''
            ) {
                setEmail(authRequest.email);
                hasEmail = true;
            }

            if (
                authRequest.password !== undefined &&
                authRequest.password !== null &&
                authRequest.password !== ''
            ) {
                setPassword(authRequest.password);
                hasPassword = true;
            }
            const canLogin: boolean = hasEmail === true && hasPassword === true;
            if (canLogin === true) {
                handleLogin(
                    authRequest.email,
                    authRequest.password,
                    setActiveUser,
                    setUserLoggedIn,
                    setLoginError,
                    setIsLoading,
                    navigate
                );
            }
        }
    }, [auth]);

    return (
        <div id="Login" className="Login">
            {isLoading ? <LoadingModal modalText="Logging in..." /> : ''}
            <div className="loginScreenIconContainer">
                <AdminUserIcon className="loginScreenIcon" />
            </div>
            <div className="loginInputContainer">
                <form
                    key="login"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleLogin(
                            email,
                            password,
                            setActiveUser,
                            setUserLoggedIn,
                            setLoginError,
                            setIsLoading,
                            navigate
                        );
                    }}
                >
                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="email">
                                Email
                                <input
                                    className={`input ${
                                        loginError ? 'error' : ''
                                    }`}
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    required
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    data-testid="email"
                                />
                            </label>
                        </div>
                        <div>
                            <label htmlFor="password">
                                Password
                                <div className="password-field">
                                    <input
                                        className={`input password-input ${
                                            loginError ? 'error' : ''
                                        }`}
                                        id="password"
                                        type={
                                            passwordVisible
                                                ? 'text'
                                                : 'password'
                                        }
                                        name="password"
                                        value={password}
                                        required
                                        autoComplete="current-password"
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        data-testid="password"
                                    />

                                    <span
                                        className="form-password-input-reveal"
                                        onClick={() =>
                                            setPasswordVisible(!passwordVisible)
                                        }
                                    >
                                        {passwordVisible ? (
                                            <GoEyeClosed />
                                        ) : (
                                            <GoEye />
                                        )}
                                    </span>
                                </div>
                            </label>
                        </div>

                        {loginError ? (
                            <p
                                id="log-in-error"
                                className="error"
                                data-testid="log-in-error"
                            >
                                {loginError}
                            </p>
                        ) : (
                            ''
                        )}
                        <div className="loginBtnContainer">
                            <Link
                                to="/password-reset-request"
                                className="btn danger"
                            >
                                Forgot Password
                            </Link>
                            <button
                                ref={buttonRef}
                                id="log-in-button"
                                type="submit"
                                className="btn primary"
                                data-testid="log-in-button"
                            >
                                Log In
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
