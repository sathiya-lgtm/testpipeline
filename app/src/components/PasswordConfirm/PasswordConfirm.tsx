import {useEffect, useState, FC} from 'react';
import FormPasswordInput from '../Inputs/FormPasswordInput';
import { IFormInputElement } from '../Inputs/FormInput';

// SASS Styles
import '../../styles/components/PasswordConfirm/PasswordConfirm.scss';

// Icons
import { FaCheck, FaTimes } from 'react-icons/fa';

export interface IPasswordRule {
    label: string;
    expression: RegExp
};

interface IPasswordCompiledRule extends IPasswordRule {
    passed: boolean;
}

export interface PasswordConfirmProps {
    passwordValue: string;
    confirmValue?: string;
    passwordLabelText?: string;
    passwordTooltipText?: string;
    confirmLabelText?: string;
    confirmTooltipText?: string;
    rules?: IPasswordRule[];
    onChanged: ( passed: boolean, password: string ) => void;
}

const createCompilesRules = ( password: string , rules: IPasswordRule[] ) => {
    if( rules ) {
        const compiledRules = rules.map((rule) => {
            return {
                label: rule.label,
                expression: rule.expression,
                passed: password.length === 0 ? false : rule.expression.test(password)
            }
        });
        return compiledRules;
    }
    return [];
}


const PasswordConfirm: FC<PasswordConfirmProps> = ( { 
    passwordValue,
    confirmValue,
    passwordLabelText, 
    passwordTooltipText,
    confirmLabelText,
    confirmTooltipText,
    rules,
    onChanged
}: PasswordConfirmProps ) => {
    const [password, setPassword] = useState<string>( passwordValue );
    const [confirm, setConfirm] = useState<string>( confirmValue ?? '' );
    const [passwordsMatch, setPasswordsMatch] = useState<boolean>(false);
    const [compiledRules, setCompilesRules] = useState<IPasswordCompiledRule[]>([]);

    const onRenderRules = () => {
        if( compiledRules ) {
            return compiledRules.map((compiledRule, index) => (
                <div key={`password-confirm-rule-${index}`} className="password-confirm-rule">
                   <div className={compiledRule.passed ? 'password-confirm-rule-match-icon' : 'password-confirm-rule-no-match-icon'}>
                        {compiledRule.passed ? <FaCheck /> : <FaTimes />}
                    </div>
                    <div className={compiledRule.passed ? 'password-confirm-rule-label-match' : 'password-confirm-rule-label-no-match'} >
                        {compiledRule.label}
                    </div>
                </div>
            ));
        }
        return null;
    }

    useEffect(() => {
        if(password && confirm && password === confirm) {
            setPasswordsMatch(true);
            return;
        }
        setPasswordsMatch(false);
    }, 
    [password, confirm]);

    /* Check if all rules passed if yes then fire off OnRulesPassed Event */
    useEffect(() => {

        const match = (password && confirm && password === confirm ? true : false);
        setPasswordsMatch( match )

        if( rules ) {
            const compiled = createCompilesRules(password ?? '', rules ?? [])
            setCompilesRules( compiled );
            if( compiled.length > 0) {
                let allPassed: boolean = true;
                compiled.forEach( rule =>  {
                    if( !rule.passed ) {
                        allPassed = false;
                    } 
                })
                if( onChanged ) {
                    onChanged( match && allPassed, password );
                }
            } 
            return;
        }
        
        if ( onChanged ) {
            onChanged( match, password );
        }

    }, [password, confirm, rules])

    return (
        <div className="password-confirm">
            <FormPasswordInput 
                id="password" 
                columnMap="password" 
                label={passwordLabelText ?? 'Password'} 
                onChange={(e) => setPassword(e?.value ?? '')} 
                placeholder="Please enter password"
                tooltip={passwordTooltipText}
                value={password} 
            />
            <FormPasswordInput 
                id="confirm" 
                columnMap="confirm" 
                label={confirmLabelText ?? 'Confirm'} 
                placeholder="Please enter confirmation"
                onChange={(e) => setConfirm(e?.value ?? '')} 
                tooltip={confirmTooltipText} 
                value={confirm}
            />

            <div className="password-confirm-rules">
                {onRenderRules()}
                <div className="password-confirm-rule">
                    <div className={passwordsMatch ? 'password-confirm-rule-match-icon' : 'password-confirm-rule-no-match-icon'}>
                        {passwordsMatch ? <FaCheck /> : <FaTimes />}
                    </div>
                    <div className={passwordsMatch ? 'password-confirm-rule-label-match' : 'password-confirm-rule-label-no-match'}>
                        Passwords Match
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PasswordConfirm;