import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, Truck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    const toastId = toast.loading('Entrando...');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      toast.success('Login bem-sucedido!', { id: toastId });
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro no login.', { id: toastId });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#A445F7] to-[#3B82F6]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center gap-3 text-white text-4xl font-bold">
            <Truck className="h-24 w-auto text-white" />
            <h1>LogiTrack</h1>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Bem-vindo de volta</h2>
            <p className="text-gray-400 mb-8">Faça login para continuar</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" size={20} />
              <input
                {...register('email')}
                type="email"
                placeholder="Email"
                className="w-full bg-gray-100 border-0 rounded-lg px-12 py-3 focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-2">{errors.email.message}</p>}
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" size={20} />
              <input
                {...register('password')}
                type="password"
                placeholder="Senha"
                className="w-full bg-gray-100 border-0 rounded-lg px-12 py-3 focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-2">{errors.password.message}</p>}
            </div>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold rounded-lg px-8 py-4 shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </motion.button>
          </form>
        </div>
      </motion.div>
      {/* Componente Toast será renderizado no App.tsx principal */}
    </div>
  );
};

export default Login;