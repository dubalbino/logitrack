import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Truck } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(3, { message: 'O nome deve ter no mínimo 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'], // path of error
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    const toastId = toast.loading('Criando conta...');
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
        },
      });

      if (error) throw error;

      toast.success('Conta criada com sucesso! Verifique seu email para confirmação.', { id: toastId, duration: 6000 });
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro ao criar a conta.', { id: toastId });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 text-white text-4xl font-bold">
            <Truck size={48} />
            <h1>LogiTrack</h1>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Crie sua conta</h2>
            <p className="text-slate-500 mb-8">Comece a gerenciar suas entregas</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                {...register('fullName')}
                type="text"
                placeholder="Nome Completo"
                className="w-full bg-slate-50 border-0 rounded-xl px-12 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-2">{errors.fullName.message}</p>}
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                {...register('email')}
                type="email"
                placeholder="Email"
                className="w-full bg-slate-50 border-0 rounded-xl px-12 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-2">{errors.email.message}</p>}
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                {...register('password')}
                type="password"
                placeholder="Senha"
                className="w-full bg-slate-50 border-0 rounded-xl px-12 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-2">{errors.password.message}</p>}
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="Confirmar Senha"
                className="w-full bg-slate-50 border-0 rounded-xl px-12 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-2">{errors.confirmPassword.message}</p>}
            </div>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl px-8 py-4 shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? 'Criando...' : 'Criar Conta'}
            </motion.button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-slate-600">
              Já tem conta?{' '}
              <Link to="/login" className="font-medium text-purple-600 hover:text-purple-700">
                Entrar →
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;